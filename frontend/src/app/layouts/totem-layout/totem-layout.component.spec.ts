import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotemLayout } from './totem-layout';

describe('TotemLayout', () => {
  let component: TotemLayout;
  let fixture: ComponentFixture<TotemLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotemLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TotemLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
