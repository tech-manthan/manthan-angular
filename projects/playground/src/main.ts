import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app';
import { DemoRoot } from './demo';

const isDemo = new URLSearchParams(location.search).has('c');
bootstrapApplication(isDemo ? DemoRoot : App).catch((err) => console.error(err));
