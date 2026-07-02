import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MusicosPage } from './musicos.page';

describe('MusicosPage', () => {
  let component: MusicosPage;
  let fixture: ComponentFixture<MusicosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MusicosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
