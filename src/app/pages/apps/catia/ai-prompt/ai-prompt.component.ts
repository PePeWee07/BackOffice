import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  icons,
} from 'lucide-angular';

import { PageTitleComponent } from '../../../../shared/page-title/page-title.component';
import { CatiaAiPromptService } from '../../../../core/services/apis/catia/catia-ai-prompt.service';
import {
  CATIA_REASONING_EFFORTS,
  CATIA_REASONING_SUMMARIES,
  CATIA_VERBOSITIES,
  CatiaAiPromptConfig,
  CatiaAiPromptConfigUpdate,
} from '../../../../core/services/apis/catia/models/catia-ai-prompt';

@Component({
  selector: 'app-catia-ai-prompt',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageTitleComponent,
    LucideAngularModule,
    TranslateModule,
  ],
  templateUrl: './ai-prompt.component.html',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(icons),
    },
  ],
})
export class CatiaAiPromptComponent implements OnInit {
  private readonly service = inject(CatiaAiPromptService);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);

  readonly efforts = CATIA_REASONING_EFFORTS;
  readonly summaries = CATIA_REASONING_SUMMARIES;
  readonly verbosities = CATIA_VERBOSITIES;

  config: CatiaAiPromptConfig | null = null;
  hasConfig = false;
  isLoading = false;
  isSaving = false;
  isSeeding = false;

  // Toggle de UI: define qué parámetros se muestran y cómo se arma el PUT.
  isReasoningModel = true;

  // Campos del formulario
  model = '';
  instructions = '';
  store = true;
  maxOutputTokens: number | null = null;

  // Razonamiento
  reasoningEffort = 'medium';
  reasoningSummary = 'auto';
  verbosity = 'medium';

  // Clásico
  temperature: number | null = null;
  topP: number | null = null;

  // Editores JSON (se reemplazan completos al guardar)
  textFormatJson = '{\n  "type": "text"\n}';
  toolsJson = '[]';
  includeJson = '[]';

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.isLoading = true;

    this.service.getConfig().subscribe({
      next: (config) => {
        this.isLoading = false;

        if (config && (config.id !== undefined || config.model || config.instructions)) {
          this.hasConfig = true;
          this.applyConfig(config);
        } else {
          this.hasConfig = false;
        }
      },
      error: (err: any) => {
        this.isLoading = false;

        if (err?.status === 404) {
          this.hasConfig = false;
          return;
        }

        this.toastr.error(this.extractError(err, this.t('messages.load-error')));
        console.error('Error ai-prompt config:', err);
      },
    });
  }

  private applyConfig(config: CatiaAiPromptConfig): void {
    this.config = config;
    this.model = config.model ?? '';
    this.instructions = config.instructions ?? '';
    this.store = config.store ?? true;
    this.maxOutputTokens = config.maxOutputTokens ?? null;

    this.reasoningEffort = config.reasoning?.effort ?? 'medium';
    this.reasoningSummary = config.reasoning?.summary ?? 'auto';
    this.verbosity = config.text?.verbosity ?? 'medium';

    this.temperature = config.temperature ?? null;
    this.topP = config.topP ?? null;

    this.textFormatJson = this.stringifyJson(config.text?.format ?? { type: 'text' });
    this.toolsJson = this.stringifyJson(config.tools ?? []);
    this.includeJson = this.stringifyJson(config.include ?? []);

    // Inferir el tipo de modelo: si hay reasoning -> razonamiento;
    // si hay temperature/topP -> clásico; en caso ambiguo, razonamiento.
    if (config.reasoning != null) {
      this.isReasoningModel = true;
    } else if (config.temperature != null || config.topP != null) {
      this.isReasoningModel = false;
    } else {
      this.isReasoningModel = true;
    }
  }

  setReasoningModel(value: boolean): void {
    this.isReasoningModel = value;
  }

  seedDefault(): void {
    if (this.isSeeding) {
      return;
    }

    this.isSeeding = true;
    this.service.seedDefault().subscribe({
      next: (config) => {
        this.isSeeding = false;
        this.hasConfig = true;
        this.applyConfig(config);
        this.toastr.success(this.t('messages.seed-success'));
      },
      error: (err: any) => {
        this.isSeeding = false;
        this.toastr.error(this.extractError(err, this.t('messages.seed-error')));
        console.error('Error seed default:', err);
      },
    });
  }

  save(): void {
    if (this.isSaving) {
      return;
    }

    if (!this.model.trim()) {
      this.toastr.info(this.t('messages.model-required'));
      return;
    }

    // Parseo de los editores JSON
    let parsedFormat: unknown;
    let parsedTools: unknown[];
    let parsedInclude: unknown[];

    try {
      parsedFormat = this.parseJson(this.textFormatJson, this.t('fields.text-format'));
      parsedTools = this.parseJsonArray(this.toolsJson, this.t('fields.tools'));
      parsedInclude = this.parseJsonArray(this.includeJson, this.t('fields.include'));
    } catch (error: any) {
      this.toastr.error(error?.message ?? this.t('messages.json-invalid'));
      return;
    }

    const body: CatiaAiPromptConfigUpdate = {
      model: this.model.trim(),
      instructions: this.instructions,
      store: this.store,
      tools: parsedTools,
      include: parsedInclude,
    };

    const clear: string[] = [];
    const text: Record<string, unknown> = { format: parsedFormat };

    if (this.isReasoningModel) {
      body.reasoning = {
        effort: this.reasoningEffort,
        summary: this.reasoningSummary,
      };
      text['verbosity'] = this.verbosity;
      // Garantizamos que los parámetros clásicos queden en null.
      clear.push('temperature', 'topP');
    } else {
      if (this.temperature !== null && `${this.temperature}` !== '') {
        body.temperature = Number(this.temperature);
      }
      if (this.topP !== null && `${this.topP}` !== '') {
        body.topP = Number(this.topP);
      }
      // verbosity es exclusivo de modelos de razonamiento (GPT-5).
      clear.push('reasoning');
    }

    body.text = text;

    // maxOutputTokens: con valor lo enviamos; vacío => lo limpiamos (sin límite).
    if (this.maxOutputTokens !== null && `${this.maxOutputTokens}` !== '') {
      body.maxOutputTokens = Number(this.maxOutputTokens);
    } else {
      clear.push('maxOutputTokens');
    }

    body.clear = clear;

    this.isSaving = true;
    this.service.updateConfig(body).subscribe({
      next: (config) => {
        this.isSaving = false;
        this.hasConfig = true;
        this.applyConfig(config);
        this.toastr.success(this.t('messages.save-success'));
      },
      error: (err: any) => {
        this.isSaving = false;
        this.toastr.error(this.extractError(err, this.t('messages.save-error')));
        console.error('Error update config:', err);
      },
    });
  }

  formatDateTime(value?: string | null): string {
    if (!value) {
      return 'N/A';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-EC', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  private stringifyJson(value: unknown): string {
    try {
      return JSON.stringify(value ?? null, null, 2);
    } catch {
      return '';
    }
  }

  private parseJson(raw: string, fieldLabel: string): unknown {
    const trimmed = (raw ?? '').trim();

    if (!trimmed) {
      return {};
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error(this.t('messages.json-field-invalid', { field: fieldLabel }));
    }
  }

  private parseJsonArray(raw: string, fieldLabel: string): unknown[] {
    const trimmed = (raw ?? '').trim();

    if (!trimmed) {
      return [];
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error(this.t('messages.json-field-invalid', { field: fieldLabel }));
    }

    if (!Array.isArray(parsed)) {
      throw new Error(this.t('messages.json-array-expected', { field: fieldLabel }));
    }

    return parsed;
  }

  private extractError(err: any, fallback: string): string {
    return (
      err?.error?.errors?.[0]?.message ||
      err?.error?.message ||
      (err?.status === 403 ? this.t('messages.forbidden') : fallback)
    );
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(
      `pagesComponent.apps.catia.aiPrompt.${key}`,
      params
    );
  }
}
