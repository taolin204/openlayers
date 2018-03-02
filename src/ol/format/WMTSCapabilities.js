/**
 * @module ol/format/WMTSCapabilities
 */
import {inherits} from '../index.js';
import {boundingExtent} from '../extent.js';
import OWS from '../format/OWS.js';
import {readHref} from '../format/XLink.js';
import XML from '../format/XML.js';
import {readString, readNonNegativeInteger, readDecimal} from '../format/xsd.js';
import {pushParseAndPop, makeStructureNS,
  makeObjectPropertySetter, makeObjectPropertyPusher, makeArrayPusher} from '../xml.js';

/**
 * @classdesc
 * Format for reading WMTS capabilities data.
 *
 * @constructor
 * @extends {ol.format.XML}
 * @api
 */
const WMTSCapabilities = function() {
  XML.call(this);

  /**
   * @type {ol.format.OWS}
   * @private
   */
  this.owsParser_ = new OWS();
};

inherits(WMTSCapabilities, XML);


/**
 * @const
 * @type {Array.<string>}
 */
const NAMESPACE_URIS = [
  null,
  'http://www.opengis.net/wmts/1.0'
];


/**
 * @const
 * @type {Array.<string>}
 */
const OWS_NAMESPACE_URIS = [
  null,
  'http://www.opengis.net/ows/1.1'
];


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'Contents': makeObjectPropertySetter(readContents)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const CONTENTS_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'Layer': makeObjectPropertyPusher(readLayer),
    'TileMatrixSet': makeObjectPropertyPusher(readTileMatrixSet)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const LAYER_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'Style': makeObjectPropertyPusher(readStyle),
    'Format': makeObjectPropertyPusher(readString),
    'TileMatrixSetLink': makeObjectPropertyPusher(readTileMatrixSetLink),
    'Dimension': makeObjectPropertyPusher(readDimensions),
    'ResourceURL': makeObjectPropertyPusher(readResourceUrl)
  }, makeStructureNS(OWS_NAMESPACE_URIS, {
    'Title': makeObjectPropertySetter(readString),
    'Abstract': makeObjectPropertySetter(readString),
    'WGS84BoundingBox': makeObjectPropertySetter(readWgs84BoundingBox),
    'Identifier': makeObjectPropertySetter(readString)
  }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const STYLE_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'LegendURL': makeObjectPropertyPusher(readLegendUrl)
  }, makeStructureNS(OWS_NAMESPACE_URIS, {
    'Title': makeObjectPropertySetter(readString),
    'Identifier': makeObjectPropertySetter(readString)
  }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const TMS_LINKS_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'TileMatrixSet': makeObjectPropertySetter(readString),
    'TileMatrixSetLimits': makeObjectPropertySetter(readTileMatrixLimitsList)
  });

/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const TMS_LIMITS_LIST_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'TileMatrixLimits': makeArrayPusher(readTileMatrixLimits)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const TMS_LIMITS_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'TileMatrix': makeObjectPropertySetter(readString),
    'MinTileRow': makeObjectPropertySetter(readNonNegativeInteger),
    'MaxTileRow': makeObjectPropertySetter(readNonNegativeInteger),
    'MinTileCol': makeObjectPropertySetter(readNonNegativeInteger),
    'MaxTileCol': makeObjectPropertySetter(readNonNegativeInteger)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const DIMENSION_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'Default': makeObjectPropertySetter(readString),
    'Value': makeObjectPropertyPusher(readString)
  }, makeStructureNS(OWS_NAMESPACE_URIS, {
    'Identifier': makeObjectPropertySetter(readString)
  }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const WGS84_BBOX_READERS = makeStructureNS(
  OWS_NAMESPACE_URIS, {
    'LowerCorner': makeArrayPusher(readCoordinates),
    'UpperCorner': makeArrayPusher(readCoordinates)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const TMS_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'WellKnownScaleSet': makeObjectPropertySetter(readString),
    'TileMatrix': makeObjectPropertyPusher(readTileMatrix)
  }, makeStructureNS(OWS_NAMESPACE_URIS, {
    'SupportedCRS': makeObjectPropertySetter(readString),
    'Identifier': makeObjectPropertySetter(readString)
  }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 */
const TM_PARSERS = makeStructureNS(
  NAMESPACE_URIS, {
    'TopLeftCorner': makeObjectPropertySetter(readCoordinates),
    'ScaleDenominator': makeObjectPropertySetter(readDecimal),
    'TileWidth': makeObjectPropertySetter(readNonNegativeInteger),
    'TileHeight': makeObjectPropertySetter(readNonNegativeInteger),
    'MatrixWidth': makeObjectPropertySetter(readNonNegativeInteger),
    'MatrixHeight': makeObjectPropertySetter(readNonNegativeInteger)
  }, makeStructureNS(OWS_NAMESPACE_URIS, {
    'Identifier': makeObjectPropertySetter(readString)
  }));


/**
 * Read a WMTS capabilities document.
 *
 * @function
 * @param {Document|Node|string} source The XML source.
 * @return {Object} An object representing the WMTS capabilities.
 * @api
 */
WMTSCapabilities.prototype.read;


/**
 * @inheritDoc
 */
WMTSCapabilities.prototype.readFromDocument = function(doc) {
  for (let n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      return this.readFromNode(n);
    }
  }
  return null;
};


/**
 * @inheritDoc
 */
WMTSCapabilities.prototype.readFromNode = function(node) {
  const version = node.getAttribute('version').trim();
  let WMTSCapabilityObject = this.owsParser_.readFromNode(node);
  if (!WMTSCapabilityObject) {
    return null;
  }
  WMTSCapabilityObject['version'] = version;
  WMTSCapabilityObject = pushParseAndPop(WMTSCapabilityObject, PARSERS, node, []);
  return WMTSCapabilityObject ? WMTSCapabilityObject : null;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Attribution object.
 */
function readContents(node, objectStack) {
  return pushParseAndPop({}, CONTENTS_PARSERS, node, objectStack);
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Layers object.
 */
function readLayer(node, objectStack) {
  return pushParseAndPop({}, LAYER_PARSERS, node, objectStack);
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Tile Matrix Set object.
 */
function readTileMatrixSet(node, objectStack) {
  return pushParseAndPop({}, TMS_PARSERS, node, objectStack);
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Style object.
 */
function readStyle(node, objectStack) {
  const style = pushParseAndPop({}, STYLE_PARSERS, node, objectStack);
  if (!style) {
    return undefined;
  }
  const isDefault = node.getAttribute('isDefault') === 'true';
  style['isDefault'] = isDefault;
  return style;

}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Tile Matrix Set Link object.
 */
function readTileMatrixSetLink(node, objectStack) {
  return pushParseAndPop({}, TMS_LINKS_PARSERS, node, objectStack);
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Dimension object.
 */
function readDimensions(node, objectStack) {
  return pushParseAndPop({}, DIMENSION_PARSERS, node, objectStack);
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Resource URL object.
 */
function readResourceUrl(node, objectStack) {
  const format = node.getAttribute('format');
  const template = node.getAttribute('template');
  const resourceType = node.getAttribute('resourceType');
  const resource = {};
  if (format) {
    resource['format'] = format;
  }
  if (template) {
    resource['template'] = template;
  }
  if (resourceType) {
    resource['resourceType'] = resourceType;
  }
  return resource;
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} WGS84 BBox object.
 */
function readWgs84BoundingBox(node, objectStack) {
  const coordinates = pushParseAndPop([], WGS84_BBOX_READERS, node, objectStack);
  if (coordinates.length != 2) {
    return undefined;
  }
  return boundingExtent(coordinates);
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Legend object.
 */
function readLegendUrl(node, objectStack) {
  const legend = {};
  legend['format'] = node.getAttribute('format');
  legend['href'] = readHref(node);
  return legend;
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} Coordinates object.
 */
function readCoordinates(node, objectStack) {
  const coordinates = readString(node).split(' ');
  if (!coordinates || coordinates.length != 2) {
    return undefined;
  }
  const x = +coordinates[0];
  const y = +coordinates[1];
  if (isNaN(x) || isNaN(y)) {
    return undefined;
  }
  return [x, y];
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} TileMatrix object.
 */
function readTileMatrix(node, objectStack) {
  return pushParseAndPop({}, TM_PARSERS, node, objectStack);
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} TileMatrixSetLimits Object.
 */
function readTileMatrixLimitsList(node, objectStack) {
  return pushParseAndPop([], TMS_LIMITS_LIST_PARSERS, node, objectStack);
}


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Object|undefined} TileMatrixLimits Array.
 */
function readTileMatrixLimits(node, objectStack) {
  return pushParseAndPop({}, TMS_LIMITS_PARSERS, node, objectStack);
}


export default WMTSCapabilities;