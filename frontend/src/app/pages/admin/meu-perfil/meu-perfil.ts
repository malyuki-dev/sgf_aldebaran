import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, User, Mail, Shield, Save } from 'lucide-angular';

@Component({
  selector: 'app-meu-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './meu-perfil.html',
  styleUrls: ['./meu-perfil.scss']
})
export class MeuPerfil implements OnInit {
  usuario: any = {
    nome: 'Carlos Admin',
    email: 'admin@sistema.com',
    perfil: 'ADMIN'
  };

  readonly icons = {
    user: User,
    mail: Mail,
    shield: Shield,
    save: Save
  };

  ngOnInit() {
    const salvo = localStorage.getItem('usuario_sgf');
    if (salvo) {
      this.usuario = JSON.parse(salvo);
    }
  }

  salvarPerfil() {
    // Basic mock save
    alert('Perfil atualizado com sucesso!');
  }
}
