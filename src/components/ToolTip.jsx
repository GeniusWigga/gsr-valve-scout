import Reflux from "reflux";
import React from "react";
import _ from "lodash";
import onClickOutside from "react-onclickoutside";
import { ToolTipStore } from "../reflux/store";

class ToolTip extends Reflux.Component {
  handleClickOutside() {
    this.setState({
      clientHeight: null,
      toolTipData: {},
    });
  }

  constructor(props) {
    super(props);

    this.state = {
      clientHeight: null,
      toolTipData: {},
    };
    this.store = ToolTipStore;
  }

  componentDidUpdate() {
    const { toolTip } = this.refs;

    if (toolTip) {
      const { clientHeight } = toolTip;
      if (_.isNil(this.state.clientHeight) || clientHeight !== this.state.clientHeight) {
        this.setState({ clientHeight });
      }
    }
  }

  render() {
    const { toolTipData, clientHeight } = this.state;
    const { questionId } = this.props;

    const parentId = _.get(toolTipData, ["parentId"], "");
    const shouldRender = !_.isEmpty(toolTipData) && parentId === questionId;

    const offsetLeft = toolTipData.offsetLeft < 100 ? 0 : toolTipData.offsetLeft - 100;
    const triangleOffsetLeft = toolTipData.offsetLeft < 100 ? toolTipData.offsetLeft : 100;

    const helpTexts = _.chain(toolTipData.helpTexts).concat().compact().value();
    const left = offsetLeft;
    const top = toolTipData.offsetTop - (clientHeight + 10);

    const stylesToolTip = {
      visibility: "visible",
      left,
      top,
    };

    const stylesTriangle = {
      left: triangleOffsetLeft,
    };

    return (
      <span ref="toolTip" style={shouldRender ? stylesToolTip : null} className="info-circle">
        <span className="info-bar-text">
          {_.map(helpTexts, (helpText, index) => (
            index == 0
              ? <span key={index}>{helpText}</span>
              : (
                <span key={index}>
                  <br />
                  {helpText}
                </span>
              )
          ))}
          <span style={stylesTriangle} className="info-bar-triangle" />
        </span>
      </span>
    );
  }
}

export default onClickOutside(ToolTip);
