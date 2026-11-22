/**
 * AG Grid Community (MIT) as one browser global. Enterprise modules are not imported.
 * Quartz is the legacy CSS theme (ag-theme-quartz), so UNA can restyle it with CSS variables.
 */
import { ModuleRegistry, AllCommunityModule, createGrid } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

window.bxAgGrid = { createGrid: createGrid };
