import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import _ from "lodash";
import CommercialPartners from "../components/CommercialPartners/CommercialPartners";
import Description from "../components/Description.jsx";
import QuestionContainer from "../components/QuestionContainer.jsx";
import ValveResultOverview from "../components/ValveResultOverview.jsx";
import Form from "../components/Form.jsx";
import Loader from "../components/Loader.jsx";
import NoAnswersOverlay from "../components/NoAnswersOverlay.jsx";
import ClearAllValuesButton from "../components/ClearAllValuesButton.jsx";
import HelpTextOverlay from "../components/HelpTextOverlay.jsx";
import Progress from "../components/Progress.jsx";
import { mapAnswersToQuestions } from "../helper/valveScoutHelper.js";
import dataLayerPush from "../helper/dataLayerHelper.js";
import OpenFormButton from "../components/OpenFormButton";
import ValveScoutSendWindow from "../components/ValveScoutSendWindow";
import { loadState, saveState } from "../helper/storage";
import "url-search-params-polyfill";

import { getAnswers, getFilteredProducts, getQuestions } from "../../newDeps/api";

export default class ValveScout extends Component {
  static propTypes = {
    onSelectValves: PropTypes.func,
  };

  static defaultProps = {
    onSelectValves: null,
  };

  constructor(props) {
    super(props);

    this._addAnswers = this._addAnswers.bind(this);

    this.state = {
      questionsChildrenCount: 0,
      customer: loadState("customer") || null,
      currentAnswers: props.initialAnswers || loadState("data", this._isOfferPortal()) || {},
      currentQuestionsWithAnswers: null,
      questions: {
        isRequesting: false,
        requestSuccess: false,
        requestFailed: false,
        data: null,
      },
      allAnswers: {
        isRequesting: false,
        requestSuccess: false,
        requestFailed: false,
        data: null,
      },
      filteredAnswers: {
        isRequesting: false,
        requestSuccess: false,
        requestFailed: false,
        data: null,
      },
      filteredProducts: {
        isRequesting: false,
        requestSuccess: false,
        requestFailed: false,
        data: null,
      },
      oldFilteredAnswers: null,
      showSendWindow: true,
      sendToShow: false,
    };

    this._isMounted = false;
  }

  static _answerToString(answer) {
    const { key } = answer;

    if (answer.label) {
      const label = answer.label["de-DE"] || answer.label.de || answer.label;
      return `${key}=${label}`;
    }
    if (answer.answer) {
      return `${key}=${answer.answer}`;
    }
    if (answer.from && answer.to) {
      return `${key}=from: ${answer.from}, to: ${answer.to}`;
    }
    return `${key}=skipped`;
  }

  _saveAnswersForAnalytics(currentAnswers) {
    const label = _.chain(currentAnswers)
      .map((value, key) => _.assign({}, value, { key }))
      .sortBy("questionNumber")
      .groupBy("questionNumber")
      .values()
      .map((answers) => _.map(answers, (answer) => _.assign({}, answer, { text: ValveScout._answerToString(answer) })))
      .map((answers) =>
        _.isArray(answers) && !_.isEmpty(answers)
          ? `#${_.head(answers).questionNumber} ${_.join(_.map(answers, "text"), ", ")}`
          : "",
      )
      .join("; ")
      .value();

    // track answer click
    dataLayerPush("answer", label);
  }

  _addAnswers(newAnswers) {
    const currentAnswers = _.reduce(
      newAnswers,
      (currentAnswers, answer, key) => {
        const currentAnswer = currentAnswers[key];

        // regular answer is an answer to a regular question, not a special "question" like kv-rate-calculator
        const isRegularAnswer = !_.get(answer, "forceSet") && !_.get(answer, "value");
        const regularAnswerKeys = ["answer, questionNumber"];
        const areAnswersEqual = _.isEqual(_.pick(currentAnswer, regularAnswerKeys), _.pick(answer, regularAnswerKeys));

        if (currentAnswer && isRegularAnswer && (areAnswersEqual || _.isEmpty(answer))) {
          delete currentAnswers[key];
        } else if (!_.isEmpty(answer)) {
          currentAnswers[key] = answer;
        }

        return currentAnswers;
      },
      _.cloneDeep(this.state.currentAnswers),
    );

    // region SEO scripts
    this._saveAnswersForAnalytics(currentAnswers);
    if (_.keys(currentAnswers).indexOf("valveOption") !== -1) {
      window._mfq = window._mfq || [];
      window._mfq.push(["newPageView", "/ventil_scout/all_questions_answered"]);
    }
    // endregion

    saveState(currentAnswers, "data", this._isOfferPortal());

    this.setState({
      ...this.state,
      currentAnswers,
      // show SendWindow after answer is changed or reset
      showSendWindow: true,
      sendToShow: false,
    });
  }

  _setQuestionsState(isRequesting, requestSuccess, requestFailed, data) {
    this.setState({
      ...this.state,
      questions: {
        isRequesting,
        requestSuccess,
        requestFailed,
        data,
      },
    });
  }

  _setAllAnswersState(isRequesting, requestSuccess, requestFailed, data) {
    this.setState({
      ...this.state,
      allAnswers: {
        isRequesting,
        requestSuccess,
        requestFailed,
        data,
      },
    });
  }

  _setFilteredAnswersState(isRequesting, requestSuccess, requestFailed, data, oldFilteredAnswers) {
    this.setState({
      ...this.state,
      filteredAnswers: {
        isRequesting,
        requestSuccess,
        requestFailed,
        data,
      },
      ...(_.isUndefined(oldFilteredAnswers)
        ? {}
        : {
            oldFilteredAnswers,
          }),
    });
  }

  _setFilteredProductsState(isRequesting, requestSuccess, requestFailed, data) {
    // fix prevent React setState on unmounted Component https://www.robinwieruch.de/react-warning-cant-call-setstate-on-an-unmounted-component
    if (!this._isMounted) {
      return;
    }

    this.setState({
      ...this.state,
      filteredProducts: {
        isRequesting,
        requestSuccess,
        requestFailed,
        // keep old data
        data: data || this.state.filteredProducts.data,
      },
    });
  }

  _getQuestions() {
    this._setQuestionsState(true, true, false, null);

    return getQuestions(this.props.locale).end((err, res) => {
      if (err) {
        console.warn("error answers: ", err);
        this._setQuestionsState(false, false, true, err);
      } else {
        this._setQuestionsState(false, true, false, res.body);
      }
    });
  }

  _getAllAnswers() {
    this._setAllAnswersState(true, true, false, null);

    return getAnswers(this.props.locale).end((err, res) => {
      if (err) {
        console.warn("error answers: ", err);
        this._setAllAnswersState(false, false, true, err);
      } else {
        this._setAllAnswersState(false, true, false, res.body);
      }
    });
  }

  _getFilteredAnswers() {
    const { filteredAnswers } = this.state;
    const { data: oldFilteredAnswers } = filteredAnswers;

    this._setFilteredAnswersState(true, true, false, null, oldFilteredAnswers);

    return getAnswers(this.props.locale, ValveScout._generateQuery(this.state.currentAnswers))
      .end((err, res) => {
        if (err) {
          console.warn("error answers: ", err);
          this._setFilteredAnswersState(false, false, true, err);
        } else {
          this._setFilteredAnswersState(false, true, false, res.body, null);
        }
      });
  }

  _getFilteredProducts() {
    this._setFilteredProductsState(true, false, false, null);

    return getFilteredProducts(locale, ValveScout._generateQuery(this.state.currentAnswers))
      .end((err, res) => {
        if (err) {
          console.warn("error answers: ", err);
          this._setFilteredProductsState(false, false, true, err);
        } else {
          this._setFilteredProductsState(false, true, false, res.body);
        }
      });
  }

  _checkIfFilteredAnswersAreEmpty() {
    const { filteredAnswers } = this.state;
    return _.every(filteredAnswers.data, (value, key) => {
      if (key !== "voltage") {
        return _.isEmpty(value);
      }
      return true;
    });
  }

  static _generateQuery(currentAnswers) {
    return _(currentAnswers)
      .mapValues((answer) => _.omit(answer, ["questionNumber"]))
      .map((value, key) => {
        const hasUserSkippedQuestion = _.isPlainObject(value) && _.isEmpty(value);

        if (hasUserSkippedQuestion) {
          return null;
        }

        let valueString = _.isPlainObject(value) ? value.answer || value.value || value : value;

        valueString = _.isArray(valueString) ? _.join(valueString, ",") : valueString;

        return `${key}=${valueString}`;
      })
      .without(null)
      .value()
      .join("&");
  }

  _setQuestionsChildrenCount() {
    const { questionContainer } = this.refs;
    const { questionsChildrenCount } = this.state;

    if (!_.isNil(questionContainer)) {
      const questionContainerDOMNode = ReactDOM.findDOMNode(questionContainer);
      const { childElementCount } = questionContainerDOMNode;
      if (childElementCount !== questionsChildrenCount) {
        this.setState({ questionsChildrenCount: childElementCount });
      }
    }
  }

  _mapAnswersAndCheckIfAvailable() {
    const { allAnswers, filteredAnswers, oldFilteredAnswers } = this.state;
    const isRequestingFilteredAnswers = filteredAnswers.isRequesting;
    const filteredAnswersData = (isRequestingFilteredAnswers && oldFilteredAnswers) || filteredAnswers.data;

    const answers = _.mapValues(allAnswers.data, (answers, key) => {
      const availableAnswers = _.chain(filteredAnswersData).get(key, "").keyBy("answer").keys().value();

      return _.map(answers, (answer) => {
        answer.available = _.includes(availableAnswers, String(answer.answer));
        return answer;
      });
    });

    answers.operatingPressure = _.get(filteredAnswersData, "operatingPressure", "");

    return answers;
  }

  _renderValveResultOverview(renderResultAndForm) {
    const { locale, onSelectValves } = this.props;
    const { filteredProducts, currentAnswers, customer } = this.state;

    const valveResultOverviewProps = {
      locale,
      filteredProducts: _.get(filteredProducts, ["data"], []),
      currentAnswers,
      onSelectValves: _.isFunction(onSelectValves) ? onSelectValves(currentAnswers) : null,
      customer,
    };

    if (renderResultAndForm) {
      return (
        <div className="valve-result-wrapper">
          <ValveResultOverview {...valveResultOverviewProps} />
        </div>
      );
    }
    return null;
  }

  _renderNoAnswersOverlay(isFilteredAnswersEmpty) {
    const { locale } = this.props;
    const { currentAnswers } = this.state;
    return isFilteredAnswersEmpty ? (
      <NoAnswersOverlay
        resetAnswersFn={() => {
          this._addAnswers(_.mapValues(currentAnswers, () => null));
        }}
        locale={locale}
      />
    ) : null;
  }

  clearVariantsInOfferPortal = () => {
    const { onSelectValves } = this.props;
    const { currentAnswers } = this.state;

    if (_.isFunction(onSelectValves)) {
      return onSelectValves(currentAnswers)(null, { clearVariants: true });
    }
  };

  _renderClearAllAnswersButton(renderResultAndForm) {
    const { locale } = this.props;
    const { currentAnswers, showSendWindow } = this.state;

    const resetAnswerFn = () => {
      // track reset click
      dataLayerPush("reset", "");

      if (this._isOfferPortal()) {
        this.clearVariantsInOfferPortal();
      }

      this._addAnswers(_.mapValues(currentAnswers, () => null));
    };

    return (
      <ClearAllValuesButton
        resetAnswersFn={resetAnswerFn}
        locale={locale}
        show={_.size(currentAnswers) >= 1}
        resultActive={renderResultAndForm && showSendWindow}
      />
    );
  }

  _openSendWindow() {
    this.setState({ ...this.state, showSendWindow: true, sendToShow: false });
  }

  _closeSendWindow() {
    this.setState({ ...this.state, showSendWindow: false });
  }

  _closeSendToForm() {
    this.setState({ ...this.state, sendToShow: true, showSendWindow: false });
  }

  _renderOpenFormButton(numResults) {
    const { locale } = this.props;
    const { currentAnswers, showSendWindow, sendToShow } = this.state;

    const isLastAnswerSet = typeof _.get(currentAnswers, ["valveOption", "answer"]) !== "undefined";
    const shouldShowOpenFormButton = isLastAnswerSet && !showSendWindow && !sendToShow && !this._isOfferPortal();

    return (
      <>
        <ValveScoutSendWindow
          locale={locale}
          show={isLastAnswerSet && showSendWindow && !this._isOfferPortal()}
          toForm={sendToShow}
          sendToShow={() => this._closeSendToForm()}
          count={numResults}
          onClose={() => this._closeSendWindow()}
        />
        <OpenFormButton locale={locale} show={shouldShowOpenFormButton} numResults={numResults} />
      </>
    );
  }

  _renderFloatingProgress() {
    const { currentAnswers, questionsChildrenCount } = this.state;

    const isSolenoidValveSelected = _.get(currentAnswers, ["valveCategory", "answer"]) === 1;
    const isLastAnswerSet = typeof _.get(currentAnswers, ["valveOption", "answer"]) !== "undefined";

    const maxQuestionCount = isSolenoidValveSelected ? 9 : 8;

    const progress = isLastAnswerSet ? 100 : ((questionsChildrenCount - 1) / maxQuestionCount) * 100;

    return _.size(currentAnswers) >= 1 ? <Progress progress={progress} /> : null;
  }

  _renderCommercialPartners = () => {
    const { locale } = this.props;

    if (this._isOfferPortal()) {
      return null;
    }

    return (
      <CommercialPartners
        setCustomer={(customer) => {
          this.setState({ customer });
          saveState(customer, "customer");
        }}
        customer={this.state.customer}
        locale={locale}
      />
    );
  };

  _isOfferPortal = () => _.isFunction(this.props.onSelectValves);

  componentDidMount() {
    this._isMounted = true;
    this._getQuestions();
    this._getAllAnswers();
    this._getFilteredAnswers();
  }

  componentDidUpdate(prevProps, prevState) {
    const { currentAnswers, filteredAnswers, filteredProducts } = this.state;
    const { currentAnswers: previousAnswers } = prevState;

    if (!_.isEqual(currentAnswers, previousAnswers) && this._isOfferPortal()) {
      this.clearVariantsInOfferPortal();
    }

    this._setQuestionsChildrenCount();

    if (!_.isEqual(currentAnswers, prevState.currentAnswers) && !filteredAnswers.isRequesting) {
      this._getFilteredAnswers();
    }

    const isLastAnswerSet = _.keys(currentAnswers).indexOf("valveOption") !== -1;

    if (
      isLastAnswerSet &&
      !filteredProducts.isRequesting &&
      _.isEqual(filteredProducts.requestSuccess, prevState.filteredProducts.requestSuccess)
    ) {
      this._getFilteredProducts();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { locale } = this.props;
    const { allAnswers, filteredAnswers, questions, currentAnswers, filteredProducts } = this.state;

    if (!allAnswers.requestSuccess || !filteredAnswers.requestSuccess || !questions.requestSuccess) {
      return <Loader customClass="main" />;
    }

    const answers = this._mapAnswersAndCheckIfAvailable();

    // Users tend to skip last questions if result was already
    // rendered. So we render the result if last question was answered
    const renderResultAndForm = _.keys(currentAnswers).indexOf("valveOption") !== -1;

    const isFilteredAnswersRequesting = filteredAnswers.isRequesting;

    const isFilteredAnswersEmpty =
      this._checkIfFilteredAnswersAreEmpty() &&
      !_.isEmpty(currentAnswers) &&
      !_.isNil(filteredAnswers.data) &&
      !_.isNil(allAnswers.data);

    const resultCount = filteredProducts.data != null ? filteredProducts.data.length : 0;
    const resultData = filteredProducts.data != null ? filteredProducts.data : [];

    const mappedQuestions = mapAnswersToQuestions(questions.data, answers);

    return (
      <div className="valve-scout-wrapper">
        <div className="valve-questions-wrapper">
          <div className="valve-questions-container">
            <Description locale={locale} />
            <QuestionContainer
              ref="questionContainer"
              isFilteredAnswersRequesting={isFilteredAnswersRequesting}
              locale={locale}
              addAnswers={this._addAnswers}
              currentAnswers={currentAnswers}
              questions={mappedQuestions}
            />
          </div>
        </div>
        {this._renderValveResultOverview(renderResultAndForm)}
        {this._renderNoAnswersOverlay(isFilteredAnswersEmpty)}
        {this._renderClearAllAnswersButton(renderResultAndForm)}
        {this._renderOpenFormButton(resultCount)}
        {this._renderFloatingProgress()}
        <Form
          locale={locale}
          currentAnswers={currentAnswers}
          resultCount={resultCount}
          resultData={resultData}
          onClose={() => this._openSendWindow()}
        />
        <HelpTextOverlay />
        {this._renderCommercialPartners()}
        <div id="valve-portal" />
      </div>
    );
  }
}
