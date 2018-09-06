import { TestBed, inject } from '@angular/core/testing';

import { BcService } from './bc.service';

describe('BcService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BcService]
    });
  });

  it('should be created', inject([BcService], (service: BcService) => {
    expect(service).toBeTruthy();
  }));
});
