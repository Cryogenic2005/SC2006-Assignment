import { NavigatedData, Page } from '@nativescript/core';
import { NearbyViewModel } from './nearby-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    page.bindingContext = new NearbyViewModel();
}