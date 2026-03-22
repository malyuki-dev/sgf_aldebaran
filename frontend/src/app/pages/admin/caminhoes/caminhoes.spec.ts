import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Caminhoes } from './caminhoes';

describe('Caminhoes', () => {
  let component: Caminhoes;
  let fixture: ComponentFixture<Caminhoes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Caminhoes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Caminhoes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
