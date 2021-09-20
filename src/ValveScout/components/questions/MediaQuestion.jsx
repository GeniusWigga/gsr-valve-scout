import React, { Component } from "react";
import PropTypes from "prop-types";
import $ from "jquery";
import _ from "lodash";
import superagent from "superagent";
import { PlainQuestion } from "../Question.jsx";
import structure from "../../../../server/helpers/structure.js";
import RadioInput from "../RadioInput.jsx";
import AnswerWrapper from "../AnswerWrapper.jsx";
import { QuestionHelpButton, QuestionNextButton } from "../QuestionButton.jsx";
import { _l } from "../../../../server/helpers/locale";
import dataLayerPush from "../../helper/dataLayerHelper.js";
import valveScout from "../../../static/valveScout.js";

const debouncedDataLayerPush = _.debounce(dataLayerPush, 300);

export default class MediaQuestion extends Component {
  static propTypes = {
    question: PropTypes.object.isRequired,
    locale: PropTypes.string.isRequired,
    addAnswers: PropTypes.func,
    currentAnswers: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      mediaSearchValue: "",
      compatibleMedia: {},
      searchIndex: [],
      success: null,
    };
  }

  onSearchKeyDown = (event) => {
    // prevent page refresh on enter
    if (event.keyCode === 13) {
      event.preventDefault();
    } else if (event.keyCode === 27) {
      this.setState({ mediaSearchValue: "" });
    }
  };

  onSearchChange = (event) => {
    const targetValue = event.target.value;

    // track all 250ms and only lowered values
    const trackingValue = _.toLower(targetValue);
    if (!_.isEmpty(trackingValue) && trackingValue.length >= 2) {
      debouncedDataLayerPush("media-search-value", trackingValue);
    }

    this.setState({ mediaSearchValue: targetValue });
  };

  _filterAnswers = () => {
    const { locale, question } = this.props;
    const { searchIndex, mediaSearchValue } = this.state;

    const splittedSearchValue = _.chain(mediaSearchValue).split(" ").compact().value();

    // only filter if user provided
    if (_.isEmpty(splittedSearchValue)) {
      return question.answers.media;
    }

    // filter answers by search value
    return _.filter(searchIndex, (answer) => {
      const label = _l(answer.label, locale);
      const answerLabelPredicate = _.some(splittedSearchValue, (searchValue) =>
        _.includes(_.toLower(label), _.toLower(searchValue)),
      );

      if (!answerLabelPredicate) {
        const { filteredMaterialLabels } = answer;

        return _.some(splittedSearchValue, (searchValue) =>
          _.some(
            filteredMaterialLabels,
            ({ housingMaterialLabel, sealingLabel }) =>
              _.includes(_.toLower(housingMaterialLabel), _.toLower(searchValue)) ||
              _.includes(_.toLower(sealingLabel), _.toLower(searchValue)),
          ),
        );
      }
      return answerLabelPredicate;
    });
  };

  showCallBackForm = () => {
    $(".call_me_back_formular_container").css("display", "block");
  };

  _renderMedia() {
    const { question, locale, addAnswers, currentAnswers } = this.props;

    const filteredAnswers = this._filterAnswers();
    const emptyAnswersString = _l(valveScout.questionMedia.emptyAnswer, locale);
    const callBackString = _l(valveScout.questionMedia.callbackForm, locale);

    if (_.isEmpty(filteredAnswers)) {
      return (
        <div className="no-answers">
          <p>{emptyAnswersString}</p>
          <a onClick={this.showCallBackForm} className="call-back-btn">
            {callBackString}
          </a>
        </div>
      );
    }

    return (
      <AnswerWrapper name="media">
        {_(filteredAnswers)
          .sortBy((answer) => String(_l(answer.label, locale)).trim().toLowerCase())
          .map((answer, index) => (
            <RadioInput
              key={index}
              answer={answer}
              locale={locale}
              addAnswers={addAnswers}
              checked={_.isEqual(_.get(currentAnswers, ["media", "answer"]), answer.answer)}
              question={question}
            />
          ))
          .value()}
      </AnswerWrapper>
    );
  }

  setCompatibleMedia = (compatibleMedia, error) => {
    const { question, locale } = this.props;

    if (error) {
      this.setState({
        compatibleMedia: {},
        searchIndex: [],
        success: false,
      });
    } else {
      this.setState({
        compatibleMedia,
        searchIndex: MediaQuestion.buildSearchIndex(question.answers.media, compatibleMedia, locale),
        success: true,
      });
    }
  };

  static buildSearchIndex(answers, compatibleMedia, locale) {
    // build search index
    return _.map(answers, (answer) => {
      const compatibleMediaId = answer.answer;

      const filteredMaterialLabels = _.chain(compatibleMedia)
        .filter((compatibleMediaEntry) => {
          const compatibleMediaArray = compatibleMediaEntry.compatibleMedia;

          return _.some(compatibleMediaArray, (mediaEntry) => mediaEntry.id === compatibleMediaId);
        })
        .map((compatibleMediaEntry) => ({
          housingMaterialLabel: _.join(
            _.map(_.get(compatibleMediaEntry, "housingMaterial"), (material) => _l(_.get(material, "value"), locale)),
            " ",
          ),
          sealingLabel: _.join(
            _.map(_.get(compatibleMediaEntry, "sealing"), (sealingValue) => _l(_.get(sealingValue, "value"), locale)),
            " ",
          ),
        }))
        .value();

      return _.assign({}, answer, { filteredMaterialLabels });
    });
  }

  componentWillReceiveProps(nextProps) {
    const { question, locale } = nextProps;
    const { compatibleMedia } = this.state;

    // we need to update the search index
    if (!_.isEmpty(compatibleMedia)) {
      this.setState({
        searchIndex: MediaQuestion.buildSearchIndex(question.answers.media, compatibleMedia, locale),
      });
    }
  }

  componentWillMount() {
    // initially fetch all compatibleMedia
    superagent.get(structure.getLinkNode("valve_scout/compatibleMedia").getUrl(this.props.locale)).end((err, res) => {
      if (err) {
        this.setCompatibleMedia({}, err);
      } else {
        this.setCompatibleMedia(res.body, false);
      }
    });
  }

  render() {
    const { question, locale, children, currentAnswers, addAnswers } = this.props;
    const { mediaSearchValue, success } = this.state;

    const disableInputClass = _.has(currentAnswers, "media") ? "disable" : "";

    if (!success) {
      return (
        <PlainQuestion question={question} locale={locale}>
          <div className="search-input-wrapper">{_l(valveScout.questionMedia.errorText, locale)}</div>
          <div className="question-button-container-wrapper">
            <QuestionHelpButton locale={locale} question={question} />
            <QuestionNextButton
              locale={locale}
              question={question}
              currentAnswers={currentAnswers}
              addAnswers={addAnswers}
            />
          </div>
        </PlainQuestion>
      );
    }

    return (
      <PlainQuestion question={question} locale={locale}>
        {/* switch-media button */ children}

        <div className={`search-input-wrapper ${disableInputClass}`}>
          <input
            className="search-input"
            onChange={this.onSearchChange}
            onKeyDown={this.onSearchKeyDown}
            type="text"
            placeholder={_l(valveScout.questionMedia.placeholder, locale)}
            value={mediaSearchValue}
            id="scout-media-search-value"
          />
          <span className="search-icon">
            <i className="fa fa-search" />
          </span>
        </div>

        {this._renderMedia()}

        <div className="question-button-container-wrapper">
          <QuestionHelpButton locale={locale} question={question} />
          <QuestionNextButton
            locale={locale}
            question={question}
            currentAnswers={currentAnswers}
            addAnswers={addAnswers}
          />
        </div>
      </PlainQuestion>
    );
  }
}
