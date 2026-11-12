package com.dajarony.comandero;

import android.content.Context;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayDeque;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "KitchenPrinter")
public class KitchenPrinterPlugin extends Plugin {
    private static final int RAW_PORT = 9100;
    private static final String RAW_SERVICE = "_pdl-datastream._tcp.";
    private final ExecutorService printQueue = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private Discovery discovery;

    @PluginMethod
    public void print(PluginCall call) {
        String ip = call.getString("ip");
        String text = call.getString("text");
        if (!isPrivateIp(ip) || text == null || text.isEmpty() || text.length() > 30_000) {
            call.reject("La dirección IP o el texto de la comanda no son válidos.");
            return;
        }
        printQueue.execute(() -> {
            try (Socket socket = new Socket()) {
                socket.connect(new InetSocketAddress(ip, RAW_PORT), 2500);
                OutputStream output = socket.getOutputStream();
                output.write(new byte[]{27, '@', 27, 't', 2});
                output.write(encode(text.replaceAll("[\\p{Cc}&&[^\n]]", " ") + "\n\n\n\n"));
                output.flush();
                call.resolve();
            } catch (IOException ex) {
                call.reject("No se pudo completar el envío a la impresora. Comprueba la red y el papel.", ex);
            }
        });
    }

    private static byte[] encode(String text) {
        if (Charset.isSupported("IBM850")) return text.getBytes(Charset.forName("IBM850"));
        return Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "").getBytes(StandardCharsets.US_ASCII);
    }

    @PluginMethod
    public void keepAwake(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        getActivity().runOnUiThread(() -> {
            if (enabled) getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            call.resolve();
        });
    }

    @PluginMethod
    public void discover(PluginCall call) {
        main.post(() -> {
            if (discovery != null) {
                call.reject("Ya hay una búsqueda en curso.");
                return;
            }
            NsdManager manager = (NsdManager) getContext().getSystemService(Context.NSD_SERVICE);
            if (manager == null) { call.reject("No se puede buscar en esta red."); return; }
            discovery = new Discovery(manager, call);
            discovery.start();
        });
    }

    @SuppressWarnings("deprecation")
    private final class Discovery implements NsdManager.DiscoveryListener {
        private final NsdManager manager;
        private final PluginCall call;
        private final ArrayDeque<NsdServiceInfo> waiting = new ArrayDeque<>();
        private final Set<String> ips = new HashSet<>();
        private final JSArray printers = new JSArray();
        private final Runnable timeout = () -> finish(null);
        private boolean resolving;
        private boolean finished;

        Discovery(NsdManager manager, PluginCall call) { this.manager = manager; this.call = call; }

        void start() {
            try {
                manager.discoverServices(RAW_SERVICE, NsdManager.PROTOCOL_DNS_SD, this);
                main.postDelayed(timeout, 5000);
            } catch (RuntimeException ex) { finish("No se pudo iniciar la búsqueda."); }
        }

        void finish(String error) {
            if (finished) return;
            finished = true;
            main.removeCallbacks(timeout);
            try { manager.stopServiceDiscovery(this); } catch (RuntimeException ignored) { }
            discovery = null;
            if (error == null) call.resolve(new JSObject().put("printers", printers));
            else call.reject(error);
        }

        private void resolveNext() {
            if (finished || resolving || waiting.isEmpty()) return;
            resolving = true;
            try {
                manager.resolveService(waiting.removeFirst(), new NsdManager.ResolveListener() {
                    public void onResolveFailed(NsdServiceInfo info, int code) { main.post(() -> resolved(null)); }
                    public void onServiceResolved(NsdServiceInfo info) { main.post(() -> resolved(info)); }
                });
            } catch (RuntimeException ex) { resolved(null); }
        }

        private void resolved(NsdServiceInfo info) {
            if (finished) return;
            if (info != null && info.getPort() == RAW_PORT) {
                InetAddress host = info.getHost();
                String ip = host == null ? null : host.getHostAddress();
                if (isPrivateIp(ip) && ips.add(ip)) printers.put(new JSObject().put("ip", ip).put("name", info.getServiceName()));
            }
            resolving = false;
            resolveNext();
        }

        public void onServiceFound(NsdServiceInfo info) {
            main.post(() -> {
                if (!finished && waiting.size() < 30) { waiting.add(info); resolveNext(); }
            });
        }
        public void onStartDiscoveryFailed(String type, int code) { main.post(() -> finish("No se pudo buscar en la red.")); }
        public void onStopDiscoveryFailed(String type, int code) { }
        public void onDiscoveryStarted(String type) { }
        public void onDiscoveryStopped(String type) { }
        public void onServiceLost(NsdServiceInfo info) { }
    }

    private static boolean isPrivateIp(String ip) {
        if (ip == null || !ip.matches("(\\d{1,3}\\.){3}\\d{1,3}")) return false;
        String[] parts = ip.split("\\.");
        int a = Integer.parseInt(parts[0]);
        int b = Integer.parseInt(parts[1]);
        for (String part : parts) if (Integer.parseInt(part) > 255) return false;
        return a == 10 || (a == 172 && b >= 16 && b <= 31) || (a == 192 && b == 168);
    }

    @Override
    protected void handleOnDestroy() {
        main.post(() -> { if (discovery != null) discovery.finish("Búsqueda cancelada."); });
        printQueue.shutdownNow();
    }
}
