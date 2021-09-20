/* eslint-disable max-classes-per-file */
import Reflux from "reflux";
import React, { Component } from "react";
import onClickOutside from "react-onclickoutside";
import classnames from "classnames";
import renderHTML from "react-render-html";
import { HelpTextStore } from "../reflux/store";

class HelpTextOverlay extends Reflux.Component {
  constructor(props) {
    super(props);

    this.state = {
      helpTextData: null,
    };
    this.store = HelpTextStore;
  }

  render() {
    const { helpTextData } = this.state;

    const imgSrc = helpTextData ? helpTextData.imgSrc : null;
    const helpText = helpTextData ? helpTextData.helpText : null;

    return (
      <div className={classnames("help-text-overlay no-answers-overlay", { show: helpTextData })}>
        <div className="help-text-wrapper">
          <HelpTextContainerOnClickOutside
            imgSrc={imgSrc}
            helpText={helpText}
            clickFN={() => this.setState({ helpTextData: null })}
          />
        </div>
      </div>
    );
  }
}

export default HelpTextOverlay;

class HelpTextContainer extends Component {
  handleClickOutside() {
    this.props.clickFN();
  }

  render() {
    const { imgSrc, helpText, clickFN } = this.props;
    const renderImage = imgSrc ? <img src={imgSrc} alt="" /> : null;

    return (
      <div className="help-text-container">
        <div className="content-wrapper">
          <a onClick={clickFN} className="close-button">
            <i className="fa fa-times" />
          </a>
          {renderImage}
          {renderHTML(helpText || "") || null}
        </div>
      </div>
    );
  }
}

const HelpTextContainerOnClickOutside = onClickOutside(HelpTextContainer);
