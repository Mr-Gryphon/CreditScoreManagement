import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionAgencyComponent } from './collection-agency.component';

describe('CollectionAgencyComponent', () => {
  let component: CollectionAgencyComponent;
  let fixture: ComponentFixture<CollectionAgencyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CollectionAgencyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionAgencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
