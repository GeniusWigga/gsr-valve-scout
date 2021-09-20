import _ from "lodash";
import React from "react";
import { List } from "react-virtualized";
import request from "superagent";
import "url-search-params-polyfill";
import classNames from "classnames";
import $ from "jquery";

import { _l } from "../../../server/helpers/locale";
import structure from "../../../server/helpers/structure";
import { filterArticleNumbers, getSearchValue, wildcardArticleNumber } from "../../../server/helpers/variants";
import valveScout from "../../static/valveScout";
import CommercialPartners from "../components/CommercialPartners/CommercialPartners";
import Loader from "../components/Loader.jsx";
import ValveResultOverview from "../components/ValveResultOverview";
import { loadState, saveState } from "../helper/storage";
import ValveSearchDialog from "../components/ValveSearchDialog";

export default class ValveSearch extends React.Component {
  constructor(props) {
    super(props);

    this.wrapperRef = null;
    this.inputRef = null;
    this.answerRefs = {};

    this.state = {
      customer: loadState("customer") || "",
      ready: false,
      error: false,
      showAnswers: false,
      rawValue: "",
      displayValue: "",
      data: [],
      filteredProducts: [],
      isFilteredProductsLoading: false,
      currentTypes: [],
      currentAndVoltageQuestion: [],
      currentAndVoltageAnswer: [],
      showDialog: false,
      answers: [],
      focus: null,
    };

    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onError = this.onError.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.setFinalAnswer = this.setFinalAnswer.bind(this);
    this.showResult = this.showResult.bind(this);
  }

  componentDidMount() {
    document.addEventListener("mousedown", this.handleClickOutside);
    document.addEventListener("touchstart", this.handleTouchStart);
    window.addEventListener("resize", this.handleResize);

    const { locale } = this.props;

    /* load all ArticleNumbers for Answer-List */
    request.get(structure.getLinkNode("valve_scout/allArticleNumbers").getUrl(locale)).end((err, res) => {
      if (err) {
        console.warn("error: could not get article-numbers for search: ", err);
      } else {
        this.setState({
          ...this.state,
          data: res.body.data,
        });
      }
    });

    /* load current-types to know what every article has */
    request.get(structure.getLinkNode("valve_scout/currentTypes").getUrl(locale)).end((err, res) => {
      if (err) {
        console.warn("error: could not get current-types for search: ", err);
      } else {
        this.setState({
          ...this.state,
          currentTypes: res.body.data,
        });
      }
    });

    /* get currentAndVoltageQuestion for ValveSearchDialog */
    request.get(structure.getLinkNode("valve_scout/questions").getUrl(locale)).end((err, res) => {
      if (err) {
        console.warn("error: could not get questions for search: ", err);
      } else {
        this.setState({
          ...this.state,
          currentAndVoltageQuestion: _.filter(res.body, (question) => question.id === "currentAndVoltage"),
        });
      }
    });

    /* get answers for currentAndVoltageQuestion */
    request.get(structure.getLinkNode("valve_scout/answers").getUrl(locale)).end((err, res) => {
      if (err) {
        console.warn("error: could not get answers for search: ", err);
      } else {
        this.setState({
          ...this.state,
          currentAndVoltageAnswer: {
            current: _.get(res.body, "current"),
            voltage: _.get(res.body, "voltage"),
          },
        });
      }
    });
  }

  componentDidUpdate() {
    const { ready, data, currentTypes, currentAndVoltageQuestion, currentAndVoltageAnswer } = this.state;
    if (!ready && data && currentTypes && currentAndVoltageQuestion && currentAndVoltageAnswer) {
      this.setState({
        ...this.state,
        ready: true,
      });
    }
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);
    document.removeEventListener("touchstart", this.handleTouchStart);
    window.removeEventListener("resize", this.handleResize);
  }

  handleClickOutside(event) {
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      this.setState({
        ...this.state,
        showAnswers: false,
        focus: null,
      });
    }
  }

  handleTouchStart(e) {
    this.handleClickOutside(e);
  }

  handleResize() {
    const answersOpen = this.state.showAnswers;
    if (answersOpen) {
      /* make <List> refresh to adapt to new size */
      this.setState(this.state);
    }
  }

  handleKeyDown(e) {
    const { focus, showAnswers, answers } = this.state;

    const _moveUp = () => {
      if (focus !== 0 && focus !== null) {
        this.setState({
          ...this.state,
          showAnswers: true,
          focus: focus - 1,
        });
      } else if (focus === 0) {
        this.setState({
          ...this.state,
          showAnswers: true,
          focus: null,
        });

        if (this.inputRef) {
          this.inputRef.focus();
        }
      }
    };

    const _moveDown = () => {
      if (focus < _.size(this.answerRefs) - 1 || focus === null) {
        this.setState({
          ...this.state,
          error: _.size(answers) === 0 /* remove error if we can open answers */,
          showAnswers: true,
          focus: showAnswers ? (focus === null ? 0 : focus + 1) : null,
        });
      }
    };

    const _closeAnswers = () => {
      if (showAnswers) {
        this.setState({
          ...this.state,
          showAnswers: false,
          focus: null,
        });
      }
    };

    switch (e.keyCode) {
      case 9 /* tabulator */:
        if (e.shiftKey) {
          _moveUp();
        } else {
          _moveDown();
        }
        e.preventDefault();
        break;
      case 27 /* esc-key */:
        _closeAnswers();
        e.preventDefault();
        break;
      case 38 /* up-arrow */:
        _moveUp();
        e.preventDefault();
        break;
      case 40 /* down-arrow */:
        _moveDown();
        e.preventDefault();
        break;
      default:
        break;
    }
  }

  onDelete() {
    this.setState({
      ...this.state,
      error: false,
      current: null,
      voltage: null,
      rawValue: "",
      displayValue: "",
      showAnswers: false,
      filteredProducts: [],
      variant: {},
      answers: [],
    });
  }

  onError() {
    /* close answers, reset focus and show error */
    this.setState({
      ...this.state,
      error: true,
      showAnswers: false,
      focus: null,
    });
  }

  onInputChange(e) {
    const displayValue = e.target.value;
    const searchValue = getSearchValue(displayValue);
    /* show Answers if at least one valid character is set */
    const showAnswers = _.size(searchValue) > 0;
    const answers = filterArticleNumbers(this.state.data, searchValue);
    const focus = null;

    this.setState({
      ...this.state,
      error: false,
      searchValue,
      displayValue,
      showAnswers,
      answers,
      focus,
    });
  }

  onSubmit(event) {
    /* if only one answer is left -> open that,
     if more answers left -> check if input is valid */
    const allAnswers = this.state.answers;
    const allAnswersSize = _.size(allAnswers);
    const answer = _.head(allAnswers);

    if (allAnswersSize === 1) {
      this.showResult(answer);
    } else if (_.get(answer, "isSolenoidValve")) {
      const topAnswerVals = _.get(answer, "displayValue").split("/");
      const topProductID = _.get(answer, "productID");

      /* filter left answers to the same, only current is allowed to be different */
      const filteredAnswersSize = _.chain(allAnswers)
        .filter((answer) => {
          const answerVals = _.get(answer, "displayValue").split("/");
          const answerProductID = _.get(answer, "productID");
          return (
            topProductID === answerProductID &&
            _.get(answerVals, 0) === _.get(topAnswerVals, 0) &&
            _.get(answerVals, 1) === _.get(topAnswerVals, 1) &&
            /* first character can be different, .-wildcard to get valves without a current */
            /* if current is unknown user can pick it in overlay later
                 or leave it empty to show data-sheet without this spec */
            _.get(answerVals, 2).substring(1) === _.get(topAnswerVals, 2).substring(1)
          );
        })
        .size()
        .value();

      /* if all left answers are the same solenoid-valve with only different currents
           we can open the valve-printer with a .-wildcard for the current
           this is only possible for non-custom-valves (not 3/918...)
        */
      if (allAnswersSize === filteredAnswersSize && _.size(topAnswerVals) === 3) {
        /* build a formatted and version of the input with help of topAnswer */
        const cleanDisplayValue = wildcardArticleNumber(_.get(answer, "displayValue"));
        const newAnswer = {
          productID: topProductID,
          displayValue: cleanDisplayValue,
          rawValue: getSearchValue(cleanDisplayValue),
          isSolenoidValve: answer.isSolenoidValve,
        };

        this.showResult(newAnswer);
      } else {
        this.onError();
      }
    } else {
      /* (answers > 1 and is no Solenoid-Valve) -> pressureControlled-Valves must be filtered to 1 answer */
      this.onError();
    }
    event.preventDefault();
  }

  setFinalAnswer(answer) {
    /* if isSolenoidValve -> asks user in dialog to enter current and voltage if he knows it */
    this.setState({
      ...this.state,
      displayValue: answer.displayValue,
      rawValue: answer.rawValue,
      focus: null,
      showAnswers: false,
      showDialog: answer.isSolenoidValve,
      answers: [answer],
    });
  }

  showResult(answer, electricityParams, submitFromHelp = false) {
    /* opens data-sheet to answer in new tab and passes customer */
    const { locale } = this.props;

    const { current, voltage } = electricityParams || {};

    this.setFinalAnswer({
      ...answer,
      ...(current && { current: { answer: current } }),
      ...(voltage && { voltage: { answer: voltage } }),
    });

    if (answer.isSolenoidValve && !electricityParams) {
      return;
    }

    const { productID, displayValue } = answer;

    const _articleNumber = submitFromHelp ? wildcardArticleNumber(displayValue) : displayValue;
    const articleNumber = encodeURIComponent(_articleNumber);

    this.setState((prevState) => ({ ...prevState, isFilteredProductsLoading: true, showDialog: false }));

    request
      .get(
        `${structure
          .getLinkNode("valve_scout/filter")
          .getUrl(locale)}?productId=${productID}&articleNumber=${articleNumber}${
          current && !submitFromHelp ? `&current=${current}` : ""
        }`,
      )
      .then((res) => {
        this.setState((prevState) => {
          return {
            ...prevState,
            ...electricityParams,
            displayValue: _articleNumber,
            filteredProducts: res.body,
            isFilteredProductsLoading: false,
          };
        });
      })
      .catch((error) => {
        this.setState((prevState) => ({
          ...prevState,
          isFilteredProductsLoading: false,
          filteredProducts: [],
        }));
        console.warn("Error could not get filtered products: ", error);
      });
  }

  saveCustomer(customer) {
    this.setState({
      ...this.state,
      customer,
    });
    saveState(customer, "customer");
  }

  render() {
    const { locale } = this.props;
    const {
      answers,
      showAnswers,
      focus,
      isFilteredProductsLoading,
      filteredProducts,
      error,
      displayValue,
      showDialog,
      currentTypes,
      ready,
      currentAndVoltageQuestion,
      currentAndVoltageAnswer,
      customer,
    } = this.state;

    if (!ready) {
      return <Loader customClass="main" />;
    }

    const renderDelete = () =>
      /* show delete-"x" only if user input is not empty */
      _.size(displayValue) > 0 ? (
        <div className="valve-search-delete" onClick={this.onDelete}>
          <i className="fa fa-times" />
        </div>
      ) : null;

    const renderAnswers = () => {
      /* reset answerRefs to empty object */
      this.answerRefs = {}; /* saving answerRefs to set Focus later */

      if (showAnswers && _.size(answers) > 0) {
        const rowRenderer = (rowProps) => {
          const renderAnswer = _.get(answers, rowProps.index);
          return (
            <button
              key={rowProps.key}
              className="valve-search-result"
              onClick={() => this.showResult(renderAnswer)}
              ref={(node) => {
                this.answerRefs[rowProps.index] = node;
              }}
              style={rowProps.style}
            >
              {renderAnswer.displayValue}
            </button>
          );
        };

        return (
          <div className="valve-search-results-wrapper">
            <List
              width={this.wrapperRef.offsetWidth}
              height={this.wrapperRef.offsetHeight * Math.min(5.5, _.size(answers))}
              rowCount={_.size(answers)}
              rowHeight={this.wrapperRef.offsetHeight}
              rowRenderer={rowRenderer}
            />
          </div>
        );
      }

      return null;
    };

    const renderError = () =>
      error ? <div className="valve-search-error">{_l(valveScout.valveSearch.error, locale)}</div> : null;

    const renderQuestionDialog = () => {
      /* prevent body/background from scrolling if dialog is open */
      $("body").css("overflow", showDialog ? "hidden" : "auto");

      const answer = _.head(answers);

      return showDialog ? (
        <ValveSearchDialog
          currentTypes={currentTypes}
          customer={customer}
          currentAndVoltageQuestion={{
            ...currentAndVoltageQuestion,
            answers: currentAndVoltageAnswer,
          }}
          locale={locale}
          answer={answer}
          onSubmit={(_voltage, _current, submitFromHelp) => {
            this.showResult(answer, { current: _current, voltage: _voltage }, submitFromHelp);
          }}
          onClose={() =>
            this.setState({
              ...this.state,
              showDialog: false,
            })
          }
        />
      ) : null;
    };

    if (focus !== null && this.answerRefs[focus]) {
      this.answerRefs[focus].focus();
    }

    const inputClassNames = `valve-search-input${error ? " valve-search-input--error" : ""}`;
    const submitClassNames = `valve-search-submit${error ? " valve-search-submit--error" : ""}`;

    const isProductEmpty = _.isEmpty(filteredProducts);
    const product = !isProductEmpty ? _.first(filteredProducts) : {};

    const showVariantHtmlBtnText = _l(valveScout.showVariantHtmlBtnText, locale);

    const currentAnswers = _.head(answers) || {};
    const voltage = _.get(currentAnswers, "voltage.answer");

    const isWildCard = _.flatMap(filteredProducts, "variants").length > 1;

    const variant = _.head(product.variants) || {};
    const current = variant.electricalConnectionType ? variant.electricalConnectionType.identifier : null;
    const articleNumberOrWithWildCard = (isWildCard ? displayValue : variant.articleNumber) || "";
    const articleNumberSubHeadline = isWildCard
      ? articleNumberOrWithWildCard
      : _.compact([voltage ? `${articleNumberOrWithWildCard} ${voltage}V` : articleNumberOrWithWildCard, current]).join(
          ", ",
        );
    const subHeadline = `${_l(valveScout.valveSearch.articleNumber, locale)} ${articleNumberSubHeadline}`;

    const query = _.map(_.pickBy({ voltage }), (value, key) => `${key}=${value}`).join("&");
    const variantHref = `${structure.getLinkNode("products").getUrl(locale)}/${product.id}/${_.toUpper(
      _.kebabCase(product.series),
    )}/${encodeURIComponent(articleNumberOrWithWildCard.split("/").join("-"))}${!_.isEmpty(query) ? `?${query}` : ""}`;

    return (
      <div className="valve-search">
        <div className="valve-search-wrapper">
          {renderQuestionDialog()}
          <div className="description-container">
            <h2 className="head-text">{_l(valveScout.valveSearch.headline, locale)}</h2>
            <p className="description">{_l(valveScout.valveSearch.description, locale)}</p>
          </div>
          <form
            className={classNames("valve-search-form")}
            onSubmit={this.onSubmit}
            ref={(node) => {
              this.wrapperRef = node;
            }}
            onKeyDown={this.handleKeyDown}
          >
            <input
              type="text"
              ref={(node) => {
                this.inputRef = node;
              }}
              className={inputClassNames}
              placeholder="A2305 / 0402 / 1322 - NO"
              onChange={this.onInputChange}
              value={displayValue}
              onFocus={() => this.setState({ ...this.state, focus: null })}
            />
            <button className={submitClassNames} onClick={this.onSubmit}>
              <div className="valve-search-submit-text">
                <i className="far fa-search" />
                <span>{_l(valveScout.valveSearch.button, locale)}</span>
              </div>
            </button>
            {renderDelete()}
            {renderAnswers()}
            {renderError()}
          </form>
          <CommercialPartners
            customer={customer}
            setCustomer={(customer) => this.saveCustomer(customer)}
            locale={locale}
          />
        </div>
        {isFilteredProductsLoading && isProductEmpty ? (
          <Loader />
        ) : (
          !isProductEmpty && (
            <ValveResultOverview
              hideVariantlink
              subHeadline={subHeadline}
              descriptionLink={
                <a className="arrow-btn" href={variantHref}>
                  {showVariantHtmlBtnText} <i className="far fa-long-arrow-right" />
                </a>
              }
              headline={_l(valveScout.valveSearch.searchResultHeadline, locale)}
              locale={locale}
              filteredProducts={filteredProducts}
              currentAnswers={currentAnswers}
              customer={customer}
            />
          )
        )}
      </div>
    );
  }
}
