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

const basicScheduleBindings = {
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
  scheduleCalendarChrome: 'light',
  useFixedPageActionBar: true,
  /** Basic Add Event: hide duplicate Add Action beside row delete (middle column keeps Add Action). */
  hideScheduleTrailingAddAction: true,
};

export default basicScheduleBindings;
