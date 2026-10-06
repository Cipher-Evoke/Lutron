/** Phase 5.2 */
import * as scheduleSlice from '../../redux/slice/schedule/scheduleSlice';
import { UseAuth } from '../../customhooks/UseAuth';
import * as userlogin from '../../redux/slice/auth/userlogin';
import * as floorSlice from '../../redux/slice/floor/floorSlice';
import * as FeedbackUI from '../../utils/FeedbackUI';
import AreaTreeDialog from '../../screens/quickcontrols/AreaTreeDialog';
import Action from '../../screens/quickcontrols/Action';
import { BaseUrl } from '../../BaseUrl';
import * as themeSlice from '../../redux/slice/theme/themeSlice';
import * as fixedActionBarStyles from '../../../../utils/fixedActionBarStyles';
import * as scheduleActionPriority from '../../../../utils/scheduleActionPriority';
import { bindScheduleSettingsModule } from '../../../../shared/settings/schedule/bindScheduleSettingsModule';
import * as scheduleTableLayout from '../../utils/quickControlTableLayout';
import {
  schedulePrimaryButtonStyle,
  scheduleSmallActionButtonStyle,
} from '../../utils/scheduleCreateStyles';
import { detailsRowActionControlsStyle } from '../../../../utils/detailsRowActionControlsStyle';

bindScheduleSettingsModule({
  scheduleSlice,
  UseAuth,
  userlogin,
  floorSlice,
  FeedbackUI,
  quickcontrols: { AreaTreeDialog, Action },
  BaseUrl,
  themeSlice,
  fixedActionBarStyles,
  scheduleActionPriority,
  scheduleAdvancedLocationsPanel: {
    ...scheduleTableLayout,
    schedulePrimaryButtonStyle,
    scheduleSmallActionButtonStyle,
    detailsRowActionControlsStyle,
  },
});

export { default } from "../../../../shared/settings/schedule/AddEvent";
