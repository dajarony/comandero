import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const featureName = process.argv[2];

if (!featureName) {
    console.error('\x1b[31mError: Por favor proporciona el nombre de la feature. Ejemplo: npm run generate-feature auth\x1b[0m');
    process.exit(1);
}

// Format the name
const featureNameLower = featureName.toLowerCase();
const featureNamePascal = featureName.charAt(0).toUpperCase() + featureName.slice(1);
const featureNameCamel = featureName.charAt(0).toLowerCase() + featureName.slice(1);

const basePath = path.join(__dirname, '..', 'src', 'features', featureNameLower);

// Define folder structure
const folders = [
    'ui',
    'logic',
    'api',
    'state',
    'types'
];

// Content templates
const templates = {
    manifest: `# FEATURE: ${featureName.toUpperCase()}
Responsabilidad:
- [Definir responsabilidades aquí]

Estado:
- use${featureNamePascal}Store

Reglas:
- UI nunca manipula estado directamente
- Lógica en bloques SUME
- API gestiona HTTP

Errores:
- ${featureName.toUpperCase()}_GENERIC_ERROR
`,

    uiComponent: `export function ${featureNamePascal}Page() {
  return (
    <div>
      <h1>${featureNamePascal} Page</h1>
    </div>
  );
}
`,

    sumeLogic: `import { handleError } from '@/core/errors/errorHandler';
// import { ${featureNameCamel}Api } from '../api/${featureNameCamel}Api';
// import { use${featureNamePascal}Store } from '../state/${featureNameCamel}Store';
import { useState } from 'react';

/**
 * SUME DOCBLOCK
 * Nombre: ${featureNamePascal} Flow
 * Tipo: Logic Block
 * 
 * Entradas:
 * - [Definir]
 * 
 * Acciones:
 * - [Definir]
 * 
 * Salidas:
 * - success: boolean
 * 
 * Errores:
 * - ${featureName.toUpperCase()}_FAILED
 */
export function use${featureNamePascal}Flow() {
  // S - Setup
  const [isLoading, setIsLoading] = useState(false);

  // U - Use
  const executeFeature = async (params: any) => {
    setIsLoading(true);
    try {
      // M - Manage
      
      return { success: true };
    } catch (error) {
      // E - Error
      handleError(error, '${featureName.toUpperCase()}_FAILED');
      return { success: false, message: (error as Error).message };
    } finally {
      setIsLoading(false);
    }
  };

  return { executeFeature, isLoading };
}
`,

    apiClient: `export const ${featureNameCamel}Api = {
  fetchData: async () => {
    // const response = await fetch('/api/${featureNameLower}');
    // return response.json();
    return { data: 'stub' };
  }
};
`,

    zustandStore: `import { create } from 'zustand';

interface ${featureNamePascal}State {
  data: any | null;
  setData: (data: any) => void;
  clear: () => void;
}

export const use${featureNamePascal}Store = create<${featureNamePascal}State>((set) => ({
  data: null,
  setData: (data) => set({ data }),
  clear: () => set({ data: null })
}));
`,

    typesDef: `export interface ${featureNamePascal}Response {
  id: string;
  name: string;
}
`
};

// Create folders recursively
const createFolder = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`\x1b[32mCreado directorio:\x1b[0m ${dir}`);
    }
};

// Create file if it doesn't exist
const createFile = (filePath, content) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`\x1b[36mCreado archivo:\x1b[0m ${path.basename(filePath)}`);
    } else {
        console.log(`\x1b[33mSaltado:\x1b[0m ${path.basename(filePath)} (ya existe)`);
    }
};

// Main execution
console.log(`\x1b[35m=== Generando Arquitectura DAJARONY v1 para: ${featureNamePascal} ===\x1b[0m`);

// Create base paths
createFolder(basePath);

// Create manifest
createFile(path.join(basePath, `${featureNameLower}.manifest.md`), templates.manifest);

// Create structure and files
folders.forEach(folder => {
    const folderPath = path.join(basePath, folder);
    createFolder(folderPath);

    switch (folder) {
        case 'ui':
            createFile(path.join(folderPath, `${featureNamePascal}Page.tsx`), templates.uiComponent);
            break;
        case 'logic':
            createFile(path.join(folderPath, `use${featureNamePascal}Flow.ts`), templates.sumeLogic);
            break;
        case 'api':
            createFile(path.join(folderPath, `${featureNameCamel}Api.ts`), templates.apiClient);
            break;
        case 'state':
            createFile(path.join(folderPath, `${featureNameCamel}Store.ts`), templates.zustandStore);
            break;
        case 'types':
            createFile(path.join(folderPath, `${featureNamePascal}Types.ts`), templates.typesDef);
            break;
    }
});

console.log(`\x1b[32m✓ Feature ${featureNamePascal} generada exitosamente.\x1b[0m`);
console.log(`\nRecuerda actualizar tu \x1b[36mdocs/ai.map.json\x1b[0m para incluir esta nueva feature.`);
