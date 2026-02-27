import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Motoristas } from './motoristas';

describe('Motoristas', () => {
  let component: Motoristas;
  let fixture: ComponentFixture<Motoristas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Motoristas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Motoristas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
