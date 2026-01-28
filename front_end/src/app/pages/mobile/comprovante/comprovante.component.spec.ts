import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprovanteComponent } from './comprovante.component';

describe('Comprovante', () => {
  let component: ComprovanteComponent;
  let fixture: ComponentFixture<ComprovanteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprovanteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComprovanteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
