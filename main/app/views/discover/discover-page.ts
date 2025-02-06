import { NavigatedData, Page } from '@nativescript/core';
import { DiscoverViewModel } from './discover-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    page.bindingContext = new DiscoverViewModel();
}