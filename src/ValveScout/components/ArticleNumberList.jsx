import React from "react";
import _ from "lodash";

export default class ArticleNumberList extends React.Component {
  render() {
    const { product } = this.props;

    return (
      <div className="article-number-list-wrapper">
        <ul className="list">
          {_.map(product.variants, (variant, index) => {
            const articleNumberFirstPart = `${_.get(variant, ["modelVersion", "version"], "")}${
              variant.modelKey || ""
            } ${variant.connectionWithValveSeat.connectionKey}`;
            const articleNumberSecondPart = variant.material.housingMaterialKey + variant.sealing.sealingKey;
            const articleNumberThirdPart =
              (_.get(variant.electricalConnectionType, "partialKey") || _.get(variant.actuatorFunction, "partialKey")) +
              (_.get(variant.solenoidType, "partialKey") || _.get(variant.actuatorType, "partialKey")) +
              (_.get(variant.protectionClass, "partialKey") || _.get(variant.actuatorSize, "partialKey"));
            const articleNumberValveOption = variant.valveOption.partialKey;

            return (
              <li className="list-row" key={index}>
                <div className="list-cell">
                  <span className="value">{articleNumberFirstPart}</span>
                  <span className="separator">/</span>
                </div>
                <div className="list-cell">
                  <span className="value">{articleNumberSecondPart}</span>
                  <span className="separator">/</span>
                </div>
                <div className="list-cell">
                  <span className="value">{articleNumberThirdPart}</span>
                  <span className="separator">{"\u2014"}</span>
                </div>
                <div className="list-cell">
                  <span className="value">{articleNumberValveOption}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
