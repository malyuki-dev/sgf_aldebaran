import { Injectable, OnDestroy } from '@angular/core';
import { NotificationService } from './notification.service';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlertSoundService implements OnDestroy {
  private active = false;
  private allowedCategories: number[] = [];
  private notificationSub?: Subscription;

  constructor(
    private notificationService: NotificationService
  ) {}

  private playedNotificationIds = new Set<number>();

  public enable(categories: number[]) {
    this.active = true;
    this.allowedCategories = categories;

    if (!this.notificationSub) {
      this.notificationSub = this.notificationService.notifications$.subscribe(notifications => {
        if (notifications && notifications.length > 0) {
          const latest = notifications[0] as any;
          
          if (latest.id && !this.playedNotificationIds.has(latest.id) && latest.servico_id && this.active) {
            this.playedNotificationIds.add(latest.id);
            if (this.allowedCategories.includes(latest.servico_id)) {
              this.playDingDong();
            }
          }
        }
      });
    }
  }

  public disable() {
    this.active = false;
    if (this.notificationSub) {
      this.notificationSub.unsubscribe();
      this.notificationSub = undefined;
    }
  }

  public updateCategories(categories: number[]) {
    this.allowedCategories = categories;
  }

  private playDingDong() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        // Envelope: attack rápido, decay natural
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;
      // "Ding" - 880Hz
      playTone(880, now, 0.4);
      // "Dong" - 660Hz (starts after ding starts decaying)
      playTone(660, now + 0.3, 0.5);

    } catch (e) {
      console.error('Web Audio API not supported', e);
    }
  }

  ngOnDestroy() {
    this.disable();
  }
}
