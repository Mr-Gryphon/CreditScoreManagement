import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BankComponent } from './bank/bank.component';
import { CompanyComponent } from './company/company.component';
import { CollectionAgencyComponent } from './collection-agency/collection-agency.component';
import { HomeComponent } from './home/home.component';
import { AdminComponent } from './admin/admin.component';

const appRoutes: Routes = [
	{
		path: '',
		component: HomeComponent,
		pathMatch: 'full'
	},
	{
		path: 'home',
		component: HomeComponent,
		pathMatch: 'full'
	},
	{
		path: 'bank',
		component: BankComponent,
		pathMatch: 'full'
	},
	{
		path: 'company',
		component: CompanyComponent,
		pathMatch: 'full'
	},
	{
		path: 'col-agency',
		component: CollectionAgencyComponent,
		pathMatch: 'full'
	},
	{
		path: 'admin',
		component: AdminComponent,
		pathMatch: 'full'
	},
];


@NgModule({
	imports: [RouterModule.forRoot(appRoutes, { useHash: true })],
	// imports: [RouterModule.forRoot(appRoutes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
