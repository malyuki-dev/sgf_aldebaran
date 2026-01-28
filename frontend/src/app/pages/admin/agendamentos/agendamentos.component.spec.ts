import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendamentosComponent } from './agendamentos.component';

describe('AgendamentoComponent', () => {
  let component: AgendamentosComponent;
  let fixture: ComponentFixture<AgendamentosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendamentosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgendamentosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
