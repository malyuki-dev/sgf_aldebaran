import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { LucideAngularModule, Settings, Save, Database } from 'lucide-angular';

@Component({
    selector: 'app-configuracoes',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './configuracoes.component.html',
    styleUrls: ['./configuracoes.component.scss']
})
export class ConfiguracoesComponent implements OnInit {
    readonly icons = { settings: Settings, save: Save, database: Database };

    form = {
        TOLERANCIA_NOSHOW: '15',
        LIMITE_SENHAS: '100',
        TEMPO_MEDIO: '12'
    };

    loading = false;
    salvando = false;

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.carregar();
    }

    carregar() {
        this.loading = true;
        this.api.get<Record<string, string>>('/configuracoes').subscribe({
            next: (data) => {
                if (data && Object.keys(data).length > 0) {
                    this.form.TOLERANCIA_NOSHOW = data['TOLERANCIA_NOSHOW'] || '15';
                    this.form.LIMITE_SENHAS = data['LIMITE_SENHAS'] || '100';
                    this.form.TEMPO_MEDIO = data['TEMPO_MEDIO'] || '12';
                }
            },
            error: (err) => {
                console.error('Erro ao carregar configurações', err);
            },
            complete: () => {
                this.loading = false;
            }
        });
    }

    salvar() {
        this.salvando = true;
        this.api.patch('/configuracoes', this.form).subscribe({
            next: () => {
                alert("Configurações salvas com sucesso!");
            },
            error: (err: any) => {
                alert("Erro ao salvar: " + (err.error?.message || ""));
            },
            complete: () => {
                this.salvando = false;
            }
        });
    }
}
