import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection } from "d3-selection";
import { drag } from "d3-drag";
import { scaleLinear } from "d3-scale";
import { range } from "d3-array";
import { axisBottom, axisLeft, axisRight } from "d3-axis";
import { line, curveStepAfter } from "d3-shape";
import "d3-transition";
import "./Svg.css";
import { NavigationDataSingleObjective } from "../types/ProblemTypes";
import { RectDimensions } from "../types/ComponentTypes";
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Form,
  ListGroup,
  Stack,
  FormLabel,
} from "react-bootstrap";
