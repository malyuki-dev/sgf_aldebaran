import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotemInicialComponent } from './totem-inicial.component';

describe('TotemInicial', () => {
  let component: TotemInicialComponent;
  let fixture: ComponentFixture<TotemInicialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotemInicialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TotemInicialComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
