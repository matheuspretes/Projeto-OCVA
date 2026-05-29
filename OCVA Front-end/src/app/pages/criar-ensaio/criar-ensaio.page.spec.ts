import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CriarEnsaioPage } from './criar-ensaio.page';

describe('CriarEnsaioPage', () => {
  let component: CriarEnsaioPage;
  let fixture: ComponentFixture<CriarEnsaioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CriarEnsaioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
