import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotemSenhaComponent } from './totem-senha.component';

describe('TotemSenha', () => {
  let component: TotemSenhaComponent;
  let fixture: ComponentFixture<TotemSenhaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotemSenhaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TotemSenhaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
