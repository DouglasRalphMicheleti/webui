import { Component, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { helptext_system_advanced } from 'app/helptext/system/advanced';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DialogService, LanguageService, StorageService, 
  SystemGeneralService, WebSocketService } from '../../../../services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { ModalService } from '../../../../services/modal.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'app-console-form',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: []
})
export class ConsoleFormComponent implements OnDestroy{
  protected queryCall = 'system.advanced.config';
  protected updateCall = 'system.advanced.update';
  protected isOneColumnForm = true;
  public sortLanguagesByName = true;
  public languageList: { label: string; value: string }[] = [];
  public languageKey: string;  
  private getDataFromDash: Subscription;
  public fieldConfig: FieldConfig[] = []

  public fieldSets: FieldSet[] = [
    {
      name: helptext_system_advanced.fieldset_console,
      label: false,
      class: 'console',
      config: [
        {
          type: 'checkbox',
          name: 'consolemenu',
          placeholder: helptext_system_advanced.consolemenu_placeholder,
          tooltip: helptext_system_advanced.consolemenu_tooltip
        },
        {
          type: 'checkbox',
          name: 'serialconsole',
          placeholder: helptext_system_advanced.serialconsole_placeholder,
          tooltip: helptext_system_advanced.serialconsole_tooltip
        },
        {
          type: 'select',
          name: 'serialport',
          placeholder: helptext_system_advanced.serialport_placeholder,
          options: [],
          tooltip: helptext_system_advanced.serialport_tooltip,
          relation: [{
            action : 'DISABLE',
            when : [{
              name: 'serialconsole',
              value: false
            }]
          }]
        },
        {
          type: 'select',
          name: 'serialspeed',
          placeholder: helptext_system_advanced.serialspeed_placeholder,
          options: [
              { label: '9600', value: "9600" },
              { label: '19200', value: "19200" },
              { label: '38400', value: "38400" },
              { label: '57600', value: "57600" },
              { label: '115200', value: "115200" },
          ],
          tooltip: helptext_system_advanced.serialspeed_tooltip,
          relation: [{
            action : 'DISABLE',
            when : [{
              name: 'serialconsole',
              value: false
            }]
          }],
        },
        {
          type: 'textarea',
          name: 'motd',
          placeholder: helptext_system_advanced.motd_placeholder,
          tooltip: helptext_system_advanced.motd_tooltip
        }
      ]
    },
  ];

  private entityForm: any;
  private configData: any;
  protected title = helptext_system_advanced.fieldset_console;

  constructor(
    protected router: Router,
    protected language: LanguageService,
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected loader: AppLoaderService,
    public http: HttpClient,
    protected storage: StorageService,
    private sysGeneralService: SystemGeneralService,
    private modalService: ModalService
  ) {
    this.getDataFromDash = this.sysGeneralService.sendConfigData$.subscribe(res => {
      this.configData = res;
    })
  }

  preInit() {}

  reconnect(href) {
    if (this.entityForm.ws.connected) {
      this.loader.close();
      // ws is connected
      window.location.replace(href);
    } else {
      setTimeout(() => {
        this.reconnect(href);
      }, 5000);
    }
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    
    this.ws.call('system.advanced.serial_port_choices').subscribe((serial_port_choices)=>{
      for(const k in serial_port_choices){
        const serialport = _.find(this.fieldSets[0].config, { name: 'serialport' });
        serialport.options.push({
          label: k, value: serial_port_choices[k]
        })
      }
    });
  }

  public customSubmit(body) {
    this.loader.open();
    return this.ws.call('system.advanced.update', [body]).subscribe(() => {
      this.loader.close();
      this.entityForm.success = true;
      this.entityForm.formGroup.markAsPristine();
      this.modalService.close('slide-in-form');
      this.sysGeneralService.refreshSysGeneral();
    }, (res) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }

  getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
  }

  ngOnDestroy() {
    this.getDataFromDash.unsubscribe();
  }

}
