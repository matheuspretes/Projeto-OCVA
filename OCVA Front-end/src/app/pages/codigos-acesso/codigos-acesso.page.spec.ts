import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CodigosAcessoPage } from './codigos-acesso.page';

describe('CodigosAcessoPage', () => {
  let component: CodigosAcessoPage;
  let fixture: ComponentFixture<CodigosAcessoPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodigosAcessoPage],
    }).compileComponents();

    fixture = TestBed.createComponent(CodigosAcessoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
