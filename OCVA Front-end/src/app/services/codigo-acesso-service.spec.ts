import { TestBed } from '@angular/core/testing';

import { CodigoAcessoService } from './codigo-acesso-service';

describe('CodigoAcessoService', () => {
  let service: CodigoAcessoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CodigoAcessoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
