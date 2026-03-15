import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Check, User, Hash, Building, Mail, Lock, Phone, AlertCircle } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {

  step: 'FORM' | 'SUCCESS' = 'FORM';
  tipo: 'PF' | 'PJ' = 'PF';
  carregando: boolean = false;

  readonly icons = {
    check: Check,
    user: User,
    hash: Hash,
    building: Building,
    mail: Mail,
    lock: Lock,
    phone: Phone,
    alert: AlertCircle
  };

  dados = {
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    cnpj: '',
    razao: '',
    senha: '',
    confirmarSenha: ''
  };

  erros: Record<string, string> = {};

  constructor(
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) { }

  // ─── Máscaras ────────────────────────────────────────────────────────────────

  aplicarMascaraCPF(valor: string): string {
    return valor
      .replace(/\D/g, '')
      .substring(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  aplicarMascaraCNPJ(valor: string): string {
    return valor
      .replace(/\D/g, '')
      .substring(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }

  aplicarMascaraTelefone(valor: string): string {
    const digits = valor.replace(/\D/g, '').substring(0, 11);
    if (digits.length <= 10) {
      // Telefone fixo: (XX) XXXX-XXXX
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    }
    // Celular: (XX) XXXXX-XXXX
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  }

  onCPFInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.dados.cpf = this.aplicarMascaraCPF(el.value);
    el.value = this.dados.cpf;
  }

  onCNPJInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.dados.cnpj = this.aplicarMascaraCNPJ(el.value);
    el.value = this.dados.cnpj;
  }

  onTelefoneInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.dados.telefone = this.aplicarMascaraTelefone(el.value);
    el.value = this.dados.telefone;
  }

  // ─── Validações ──────────────────────────────────────────────────────────────

  validarCPF(cpf: string): boolean {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(digits[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(digits[9])) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(digits[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(digits[10]);
  }

  validarCNPJ(cnpj: string): boolean {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
    const calc = (n: number) => {
      let soma = 0;
      let peso = n - 7;
      for (let i = 0; i < n; i++) {
        soma += parseInt(digits[i]) * peso--;
        if (peso < 2) peso = 9;
      }
      const r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    };
    return calc(12) === parseInt(digits[12]) && calc(13) === parseInt(digits[13]);
  }

  validarEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  validarTelefone(tel: string): boolean {
    const digits = tel.replace(/\D/g, '');
    return digits.length === 10 || digits.length === 11;
  }

  validarCampo(campo: string): void {
    const erros: Record<string, string> = { ...this.erros };

    switch (campo) {
      case 'nome':
        if (!this.dados.nome.trim()) erros['nome'] = 'Nome obrigatório.';
        else if (this.dados.nome.trim().length < 3) erros['nome'] = 'Mínimo 3 caracteres.';
        else delete erros['nome'];
        break;
      case 'razao':
        if (!this.dados.razao.trim()) erros['razao'] = 'Razão Social obrigatória.';
        else delete erros['razao'];
        break;
      case 'cpf':
        if (!this.dados.cpf) erros['cpf'] = 'CPF obrigatório.';
        else if (!this.validarCPF(this.dados.cpf)) erros['cpf'] = 'CPF inválido.';
        else delete erros['cpf'];
        break;
      case 'cnpj':
        if (!this.dados.cnpj) erros['cnpj'] = 'CNPJ obrigatório.';
        else if (!this.validarCNPJ(this.dados.cnpj)) erros['cnpj'] = 'CNPJ inválido.';
        else delete erros['cnpj'];
        break;
      case 'email':
        if (!this.dados.email) erros['email'] = 'E-mail obrigatório.';
        else if (!this.validarEmail(this.dados.email)) erros['email'] = 'E-mail inválido.';
        else delete erros['email'];
        break;
      case 'telefone':
        if (this.dados.telefone && !this.validarTelefone(this.dados.telefone))
          erros['telefone'] = 'Telefone inválido. Ex: (00) 00000-0000';
        else delete erros['telefone'];
        break;
      case 'senha':
        if (!this.dados.senha) erros['senha'] = 'Senha obrigatória.';
        else if (this.dados.senha.length < 8) erros['senha'] = 'Mínimo 8 caracteres.';
        else delete erros['senha'];
        // re-validar confirmar quando a senha muda
        if (this.dados.confirmarSenha) {
          if (this.dados.confirmarSenha !== this.dados.senha)
            erros['confirmarSenha'] = 'As senhas não coincidem.';
          else delete erros['confirmarSenha'];
        }
        break;
      case 'confirmarSenha':
        if (!this.dados.confirmarSenha) erros['confirmarSenha'] = 'Confirme a senha.';
        else if (this.dados.confirmarSenha !== this.dados.senha) erros['confirmarSenha'] = 'As senhas não coincidem.';
        else delete erros['confirmarSenha'];
        break;
    }

    this.erros = erros;
  }

  formularioValido(): boolean {
    if (this.tipo === 'PF') {
      if (!this.dados.nome.trim() || this.dados.nome.trim().length < 3) return false;
      if (!this.validarCPF(this.dados.cpf)) return false;
    } else {
      if (!this.dados.razao.trim()) return false;
      if (!this.validarCNPJ(this.dados.cnpj)) return false;
    }
    if (!this.validarEmail(this.dados.email)) return false;
    if (this.dados.telefone && !this.validarTelefone(this.dados.telefone)) return false;
    if (!this.dados.senha || this.dados.senha.length < 8) return false;
    if (this.dados.senha !== this.dados.confirmarSenha) return false;
    return true;
  }

  // ─── Submissão ───────────────────────────────────────────────────────────────

  criar() {
    // Dispara validação de todos os campos obrigatórios
    const campos = this.tipo === 'PF'
      ? ['nome', 'cpf', 'email', 'telefone', 'senha', 'confirmarSenha']
      : ['razao', 'cnpj', 'email', 'telefone', 'senha', 'confirmarSenha'];
    campos.forEach(c => this.validarCampo(c));

    if (!this.formularioValido()) return;

    this.carregando = true;

    const payload = {
      nome: this.tipo === 'PF' ? this.dados.nome.trim() : this.dados.razao.trim(),
      email: this.dados.email.trim(),
      telefone: this.dados.telefone || null,
      senha: this.dados.senha,
      tipo: this.tipo,
      cpf: this.tipo === 'PF' ? this.dados.cpf : null,
      cnpj: this.tipo === 'PJ' ? this.dados.cnpj : null
    };

    this.authService.signup(payload).subscribe({
      next: () => {
        this.carregando = false;
        this.step = 'SUCCESS';
        this.cd.detectChanges();
      },
      error: (err) => {
        this.carregando = false;
        const mensagem = err.error?.message || 'Erro ao criar conta.';
        alert(mensagem);
        this.cd.detectChanges();
      }
    });
  }
}