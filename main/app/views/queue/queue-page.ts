import { NavigatedData, Page } from '@nativescript/core';
import { QueueViewModel } from './queue-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    page.bindingContext = new QueueViewModel();
}