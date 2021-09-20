import React from "react";
import Reflux from "reflux";
import * as _ from "lodash";
import jQuery from "jquery";
import { QuestionAnimationWrapperStore } from "../reflux/store";
import { QuestionAnimationWrapperActions } from "../reflux/actions.js";
import { getCoords } from "../helper/layoutHelper";

export default class QuestionsAnimationWrapper extends Reflux.Component {
  static _scrollToJQuery(offsetTop, callback) {
    const body = jQuery("html, body");
    body.stop().animate({ scrollTop: offsetTop }, "1000", "swing", callback);
  }

  timer = null;

  _scrollToQuestion(questionWrapper, prevChildren, currChildren) {
    const lastQuestion = _.last(_.get(questionWrapper, ["children"], null));

    // don't scroll to first question if there is only the first question
    const lastQuestionOffsetTop = lastQuestion && _.size(currChildren) > 1 ? getCoords(lastQuestion).top : null;

    const isChildrenEqual = _.size(currChildren) === _.size(prevChildren);

    // scroll on initial load or if number of questions changed
    const shouldScroll = !isChildrenEqual || !this.state.scrolledInitial;

    if (!_.isNull(lastQuestionOffsetTop) && shouldScroll) {
      QuestionsAnimationWrapper._scrollToJQuery(lastQuestionOffsetTop, () => {
        QuestionAnimationWrapperActions.scrolledInitial();
      });
    }
  }

  _scrollToResult() {
    clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      const resultWrapperOffset = jQuery(".valve-result-overview-wrapper").offset();
      const resultWrapperOffsetTop = resultWrapperOffset ? resultWrapperOffset.top : null;

      if (!_.isNull(resultWrapperOffsetTop)) {
        QuestionsAnimationWrapper._scrollToJQuery(resultWrapperOffsetTop, () => {
          QuestionAnimationWrapperActions.scrolledToResults();
        });
      }
    }, 150);
  }

  constructor(props) {
    super(props);
    this.store = QuestionAnimationWrapperStore;
  }

  componentDidUpdate(prevProps) {
    const questionWrapper = _.get(this.refs, ["questionWrapper"], null);

    const { children: prevChildren, currentAnswers: previousAnswers } = prevProps;
    const { children: currChildren, currentAnswers } = this.props;

    const wasLastAnswerSet = _.keys(previousAnswers).indexOf("valveOption") !== -1;
    const isLastAnswerSet = _.keys(currentAnswers).indexOf("valveOption") !== -1;

    // scroll to result if last answer was set
    // ... or on browser reload if last answer was already set
    const scrollToResult = (!wasLastAnswerSet && isLastAnswerSet) || (isLastAnswerSet && !this.state.scrolledInitial);

    if (scrollToResult) {
      this._scrollToResult();
    } else {
      this._scrollToQuestion(questionWrapper, prevChildren, currChildren);
    }
  }

  render() {
    const { children } = this.props;

    return (
      <div ref="questionWrapper" className="questions-wrapper">
        {children}
      </div>
    );
  }
}
