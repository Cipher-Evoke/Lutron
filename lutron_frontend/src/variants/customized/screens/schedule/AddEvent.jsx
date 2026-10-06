/** Phase 5.2 */
import { bindScheduleSettingsModule } from '../../../../shared/settings/schedule/bindScheduleSettingsModule';
import customizedScheduleBindings from './customizedScheduleBindings';

bindScheduleSettingsModule(customizedScheduleBindings);

export { default } from "../../../../shared/settings/schedule/AddEvent";
