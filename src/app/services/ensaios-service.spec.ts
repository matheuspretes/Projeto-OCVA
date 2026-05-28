import { TestBed } from '@angular/core/testing';

import { EnsaiosService } from './ensaios-service';

describe('EnsaiosService', () => {
  let service: EnsaiosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsaiosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
