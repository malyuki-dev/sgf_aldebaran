import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, User, Mail, Camera, Save, Lock, Smartphone, Eye, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-supervisor-perfil',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule, RouterLink],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class SupervisorPerfilComponent implements OnInit {
  icons = { user: User, mail: Mail, camera: Camera, save: Save, lock: Lock, smartphone: Smartphone, eye: Eye, check: CheckCircle };
  
  perfilForm!: FormGroup;
  fotoUrl: string | null = null;
  fotoNova: File | null = null;
  usuarioId: number = 0;
  successModal = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.perfilForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: [''],
      departamento: [''],
      senhaAtual: [''],
      novaSenha: [''],
      confirmarSenha: ['']
    }, { validators: this.senhasIguaisValidator });

    this.carregarDados();
  }

  senhasIguaisValidator(group: FormGroup) {
    const senha = group.get('novaSenha')?.value;
    const confirmacao = group.get('confirmarSenha')?.value;
    return senha === confirmacao ? null : { senhasDiferentes: true };
  }

  carregarDados() {
    const salvo = localStorage.getItem('usuario_sgf');
    if (salvo) {
      const user = JSON.parse(salvo);
      this.usuarioId = user.id;
      this.perfilForm.patchValue({
        nome: user.nome || 'Roberta Alves',
        email: user.email || 'roberta.alves@fila.com',
        telefone: user.telefone || '(11) 98765-4321',
        departamento: user.departamento || 'Gestão'
      });
      // Try to load photo if user object had it
      if (user.fotoPerfil) {
        this.fotoUrl = 'http://localhost:3000' + user.fotoPerfil;
      }
    } else {
       // Mock fallback
       this.perfilForm.patchValue({
        nome: 'Roberta Alves',
        email: 'roberta.alves@fila.com',
        telefone: '(11) 98765-4321',
        departamento: 'Gestão'
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fotoNova = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fotoUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  salvar() {
    console.log('Salvando perfil:', this.perfilForm.value);
    
    this.successModal = true;
    this.perfilForm.patchValue({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
    this.perfilForm.markAsPristine();
    this.fotoNova = null;
    
    setTimeout(() => {
       this.fecharModal();
    }, 5000);
  }

  fecharModal() {
     this.successModal = false;
  }
}
