import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RestService, Zone, GuardPost } from '../../../services/rest.service';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

interface ZoneWithGuardPost extends Zone {
  linkedGuardPostId?: string;
  linkedGuardPostName?: string;
}

@Component({
  selector: 'app-gate-zone-manage-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    FormsModule,
    FlexLayoutModule
  ],
  templateUrl: './gate-zone-manage-dialog.component.html',
  styleUrl: './gate-zone-manage-dialog.component.scss'
})
export class GateZoneManageDialogComponent implements OnInit {
  isLoading = true;
  allZones: ZoneWithGuardPost[] = [];
  selectedZoneIds: Set<string> = new Set();
  allGuardPosts: GuardPost[] = [];

  constructor(
    private dialogRef: MatDialogRef<GateZoneManageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { guardPost: GuardPost, projectId: string },
    private restService: RestService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

    const zones$ = (this.restService as any).getZones(this.data.projectId);
    const linked$ = this.restService.getGuardPostZones(this.data.guardPost.id);
    const guardPosts$ = this.restService.getGuardPosts(this.data.projectId);

    forkJoin({
      zones: zones$,
      linked: linked$,
      guardPosts: guardPosts$
    }).subscribe({
      next: (res) => {
        const zonesRes = res.zones;
        const linkedRes = res.linked;
        const guardPostsRes = res.guardPosts;

        // Handle guard posts
        this.allGuardPosts = (guardPostsRes as any).data || [];

        // Handle zonesRes
        let rawZones: Zone[] = [];
        if (Array.isArray(zonesRes)) {
          rawZones = zonesRes as Zone[];
        } else if ((zonesRes as any).data) {
          rawZones = (zonesRes as any).data;
        }

        // Map zones with their linked guard posts
        this.allZones = rawZones.map(zone => {
          const zoneWithPost: ZoneWithGuardPost = { ...zone };

          // Check if this zone is linked to another guard post
          if (zone.guard_post_id && zone.guard_post_id !== this.data.guardPost.id) {
            const linkedPost = this.allGuardPosts.find(p => p.id === zone.guard_post_id);
            zoneWithPost.linkedGuardPostId = zone.guard_post_id;
            zoneWithPost.linkedGuardPostName = linkedPost?.post_name || 'ป้อมอื่น';
          }

          return zoneWithPost;
        });

        // Handle linkedRes - zones linked to current guard post
        const linkedData = (linkedRes as any).data || [];
        linkedData.forEach((z: Zone) => this.selectedZoneIds.add(z.id));

        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  toggleZone(zoneId: string) {
    if (this.selectedZoneIds.has(zoneId)) {
      this.selectedZoneIds.delete(zoneId);
    } else {
      this.selectedZoneIds.add(zoneId);
    }
  }

  isZoneSelected(zoneId: string): boolean {
    return this.selectedZoneIds.has(zoneId);
  }

  isZoneDisabled(zone: ZoneWithGuardPost): boolean {
    // Disable if zone is linked to another guard post (not current one)
    return !!zone.linkedGuardPostId;
  }

  onSave() {
    console.log('onSave called');
    console.log('guardPost.id:', this.data.guardPost?.id);
    console.log('selectedZoneIds:', Array.from(this.selectedZoneIds));

    this.isLoading = true;
    const ids = Array.from(this.selectedZoneIds);

    // First, unbind all existing zones from this guard post
    console.log('Unbinding all zones first...');
    this.restService.unbindZonesFromGuardPost(this.data.guardPost.id).subscribe({
      next: () => {
        console.log('Unbind success, now binding new zones...');

        // If no zones selected, just close the dialog
        if (ids.length === 0) {
          console.log('No zones to bind, closing dialog');
          this.dialogRef.close(true);
          return;
        }

        // Then bind the newly selected zones
        this.restService.bindZonesToGuardPost(this.data.guardPost.id, ids).subscribe({
          next: (res) => {
            console.log('bindZonesToGuardPost success:', res);
            this.dialogRef.close(true);
          },
          error: (err) => {
            console.error('bindZonesToGuardPost error:', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('unbindZonesFromGuardPost error:', err);
        this.isLoading = false;
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
