import Reflux from "reflux";
import $ from "jquery";
import { FormActions, HelpTextActions, QuestionAnimationWrapperActions, ToolTipActions } from "./actions.js";

export class FormStore extends Reflux.Store {
  constructor() {
    super();

    this.listenables = FormActions;

    this.state = {
      isFormActive: false,
    };
  }

  showForm(isFormActive) {
    // don't know if nice here but where else?
    $("body").css("overflow", isFormActive ? "hidden" : "auto");
    return this.setState({ isFormActive });
  }
}

export class ToolTipStore extends Reflux.Store {
  constructor() {
    super();

    this.listenables = ToolTipActions;

    this.state = {};
  }

  showToolTip(toolTipData) {
    return this.setState({ toolTipData });
  }
}

export class HelpTextStore extends Reflux.Store {
  constructor() {
    super();

    this.listenables = HelpTextActions;

    this.state = {};
  }

  showHelpText(helpTextData) {
    return this.setState({ helpTextData });
  }
}

export class QuestionAnimationWrapperStore extends Reflux.Store {
  constructor() {
    super();

    this.listenables = QuestionAnimationWrapperActions;

    this.state = {
      scrolledInitial: false,
      scrolledToResults: false,
    };
  }

  scrolledToResults() {
    return this.setState({
      scrolledToResults: true,
      scrolledInitial: true,
    });
  }

  scrolledInitial() {
    return this.setState({
      scrolledInitial: true,
    });
  }
}
