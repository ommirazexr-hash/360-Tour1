import { app } from '../src/app';
import { projectStore } from '../src/lib/project-store';

// Initialize the project store on container boot
projectStore.init();

export default app;
