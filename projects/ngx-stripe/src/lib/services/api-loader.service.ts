import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DocumentRef } from './document-ref.service';
import { PlatformService } from './platform.service';
import { WindowRef } from './window-ref.service';

export interface Status {
  loaded: boolean;
  loading: boolean;
  error: boolean;
}

@Injectable()
export class LazyStripeAPILoader {
  private status: BehaviorSubject<Status> = new BehaviorSubject<Status>({
    error: false,
    loaded: false,
    loading: false
  });

  constructor(
    private window: WindowRef,
    private document: DocumentRef,
    private _platform: PlatformService
  ) {}

  public asStream(): Observable<Status> {
    this.load();
    return this.status.asObservable();
  }

  public isReady(): boolean {
    return this.status.getValue().loaded;
  }

  public load() {
    if (this._platform.isServer) {
      return;
    }
    if (this.window.getNativeWindow().hasOwnProperty('Stripe')) {
      this.status.next({
        error: false,
        loaded: true,
        loading: false
      });
    } else {
      if (!this.status.getValue().loaded && !this.status.getValue().loading) {
        this.status.next({
          ...this.status.getValue(),
          loading: true
        });

        const script = this.document
          .getNativeDocument()
          .createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;
        script.src = 'https://js.stripe.com/v3/';

        script.onload = () => {
          this.status.next({
            error: false,
            loaded: true,
            loading: false
          });
        };

        script.onerror = () => {
          this.status.next({
            error: true,
            loaded: false,
            loading: false
          });
        };

        this.document.getNativeDocument().body.appendChild(script);
      }
    }
  }
}
