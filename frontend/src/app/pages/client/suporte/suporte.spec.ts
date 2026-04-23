import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Suporte } from './suporte';

describe('Suporte', () => {
  let component: Suporte;
  let fixture: ComponentFixture<Suporte>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Suporte]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Suporte);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
