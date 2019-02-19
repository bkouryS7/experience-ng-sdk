import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

import { RequestContextService } from './request-context.service';
import { ApiUrlsService } from './api-urls.service';

import { PageModelService } from './page-model.service';

import { _initializeCmsIntegration } from '../common-sdk/utils/initialize-cms-integration';
import { logCmsCreateOverlay } from '../common-sdk/utils/page-model';
import { Subscription } from 'rxjs';
import { ApiUrls, ComponentMappings } from '../common-sdk/types';
import { ComponentMappingsService } from '../services/component-mappings.service';

@Injectable()
export class InitializeSdkService {
  constructor(
    private pageModelService: PageModelService,
    private requestContextService: RequestContextService,
    private router: Router,
    private apiUrlsService: ApiUrlsService,
    private componentMappingsService: ComponentMappingsService
  ) {}

  initialize(options: InitializeSdkOptions): Subscription {
    this.apiUrlsService.setApiUrls(options.apiUrls);
    this.requestContextService.parseUrlPath(this.router.url);
    if (options.componentMappings) {
      this.componentMappingsService.setComponentMappings(options.componentMappings);
    }
    this.initializeCmsIntegration();
    this.fetchPageModel();

    // fetch Page Model API when navigated to a PageComponent
    return this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.requestContextService.parseUrlPath(event.url);
        this.fetchPageModel();
      }
    });
  }

  private fetchPageModel(): void {
    this.pageModelService.fetchPageModel().subscribe();
  }

  // using arrow function so that scope (this) is preserved on callback
  private updateComponent = (id: string, propertiesMap): void => {
    this.pageModelService.updateComponent(id, propertiesMap).subscribe();
  }

  private initializeCmsIntegration(): void {
    _initializeCmsIntegration(this.onCmsInitialization, this.updateComponent);
  }

  // using arrow function so that scope (this) is preserved on callback
  private onCmsInitialization = (cms: any): void => {
    const debugging: boolean = this.requestContextService.getDebugging();
    this.pageModelService.setChannelManagerApi(cms);
    if (this.pageModelService.getPageModel()) {
      cms.createOverlay();
      logCmsCreateOverlay(debugging);
    }
  }
}

export interface InitializeSdkOptions {
  apiUrls: ApiUrls;
  componentMappings?: ComponentMappings;
}
