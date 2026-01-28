import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotemCategoriaComponent } from './totem-categoria.component';

describe('TotemCategoria', () => {
  let component: TotemCategoriaComponent;
  let fixture: ComponentFixture<TotemCategoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotemCategoriaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TotemCategoriaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
