import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { Http, HttpModule } from '@angular/http';
import { ChartsModule } from 'ng2-charts';
import { NgxSpinnerModule } from 'ngx-spinner';
// import { Ng4LoadingSpinnerModule } from 'ng4-loading-spinner';
import { AppComponent } from './app.component';
import { BankComponent } from './bank/bank.component';
import { CompanyComponent } from './company/company.component';
import { CollectionAgencyComponent } from './collection-agency/collection-agency.component';
import { HomeComponent } from './home/home.component';
import { AdminComponent } from './admin/admin.component';
import { AppRoutingModule } from './/app-routing.module';
import { BcService } from './bc.service';
import { NavbarComponent } from './navbar/navbar.component';

@NgModule({
	declarations: [
		AppComponent,
		BankComponent,
		CompanyComponent,
		CollectionAgencyComponent,
		AdminComponent,
		HomeComponent,
		NavbarComponent
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		ChartsModule,
		FormsModule,
		HttpModule,
		NgbModule.forRoot(),
		SimpleNotificationsModule.forRoot(),
		// Ng4LoadingSpinnerModule.forRoot(),
		AppRoutingModule,
		NgxSpinnerModule.forRoot()
	],
	providers: [BcService],
	bootstrap: [AppComponent]
})
export class AppModule { }
