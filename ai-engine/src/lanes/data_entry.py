"""Data entry verification lane - checks data submissions."""
from typing import Dict, Any, List
import json

from src.lanes.base import VerificationLane, Criterion, PFISignal, VerificationReport
from src.utils.openai_client import openrouter_client
from src.utils.logger import verification_logger


class DataEntryLane(VerificationLane):
    """Verification lane for data entry gigs."""

    GIG_TYPE = "DATA_ENTRY"

    async def verify(
        self, submission: Dict[str, Any], criteria: List[Dict[str, Any]]
    ) -> VerificationReport:
        """Verify a data entry submission.

        Args:
            submission: Dict with file URLs or text content
            criteria: List of criteria to verify

        Returns:
            VerificationReport with scores
        """
        verification_logger.info(f"Starting data entry verification")

        try:
            # Get data content
            file_urls = submission.get("file_urls", [])
            text_content = submission.get("text_content", "")

            if not file_urls and not text_content:
                raise ValueError("No data provided for verification")

            # Verify each criterion
            verified_criteria = []
            pfi_signals = []

            for criterion_config in criteria:
                criterion_name = criterion_config["name"]
                criterion_type = criterion_config["type"]

                # Route to appropriate verification method
                if criterion_name == "Schema Compliance":
                    result = await self._verify_schema(text_content, criterion_config)
                elif criterion_name == "Row Count":
                    result = await self._verify_row_count(text_content, criterion_config)
                elif criterion_name == "Column Count":
                    result = await self._verify_column_count(text_content, criterion_config)
                elif criterion_name == "Data Types":
                    result = await self._verify_data_types(text_content, criterion_config)
                elif criterion_name == "Data Accuracy":
                    result = await self._verify_data_accuracy(text_content, criterion_config)
                elif criterion_name == "Duplicate Data":
                    result = await self._verify_duplicates(text_content)
                elif criterion_name == "Missing Values":
                    result = await self._verify_missing_values(text_content)
                elif criterion_name == "Formatting":
                    result = await self._verify_formatting(text_content, criterion_config)
                elif criterion_name == "Consistency":
                    result = await self._verify_consistency(text_content, criterion_config)
                else:
                    verification_logger.warning(f"Unknown criterion: {criterion_name}")
                    continue

                status, detail, score = self.get_criterion_status(criterion_name, result)

                if criterion_type == "SECONDARY":
                    pfi_signals.append(
                        PFISignal(
                            name=criterion_name,
                            status="WARNING" if score < 1.0 else "INFO",
                            detail=detail,
                        )
                    )
                else:
                    verified_criteria.append(
                        Criterion(
                            name=criterion_name,
                            type=criterion_type,
                            status=status,
                            detail=detail,
                            weight=criterion_config.get("weight", 0.1),
                        )
                    )

            # Calculate overall score
            overall_score = self.calculate_overall_score(verified_criteria, pfi_signals)

            # Determine payment decision
            payment_decision = self.determine_payment_decision(overall_score)

            # Generate feedback
            feedback = self.generate_feedback(verified_criteria)

            # Create report
            report = VerificationReport(
                milestone_id=submission.get("milestone_id", "unknown"),
                gig_type=self.GIG_TYPE,
                gig_subtype=submission.get("gig_subtype", "unknown"),
                overall_score=overall_score,
                payment_decision=payment_decision,
                criteria=verified_criteria,
                pfi_signals=pfi_signals,
                resubmissions_remaining=submission.get("resubmissions_remaining", 2),
                feedback_for_freelancer=feedback,
                verification_lane=self.lane_name,
            )

            verification_logger.info(f"Data entry verification complete: score={overall_score}")
            return report

        except Exception as e:
            verification_logger.error(f"Data entry verification failed: {e}")
            raise Exception(f"Verification failed: {str(e)}") from e

    def _parse_csv_data(self, text: str) -> List[dict]:
        """Parse CSV text into list of dictionaries.

        Returns:
            List of dictionaries representing rows
        """
        try:
            import csv
            from io import StringIO

            reader = csv.DictReader(StringIO(text))
            return list(reader)
        except Exception as e:
            verification_logger.error(f"CSV parsing failed: {e}")
            return []

    def _parse_json_data(self, text: str) -> List[dict]:
        """Parse JSON text into list of dictionaries.

        Returns:
            List of dictionaries representing rows
        """
        try:
            data = json.loads(text)
            return data if isinstance(data, list) else [data]
        except Exception as e:
            verification_logger.error(f"JSON parsing failed: {e}")
            return []

    async def _verify_schema(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify data schema matches requirements.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            description = criterion_config.get("description", "")

            # Parse data
            data = self._parse_csv_data(text) or self._parse_json_data(text)

            if not data:
                return "FAIL", "No data found", 0.0

            # Get expected columns from description
            import re
            expected_columns = re.findall(r'"([^"]+)"\s+column', description.lower())
            if not expected_columns:
                expected_columns = re.findall(r'(\w+)\s*(column|field)', description.lower())

            actual_columns = list(data[0].keys()) if data else []

            if expected_columns:
                missing = set(c.lower() for c in expected_columns) - set(c.lower() for c in actual_columns)
                extra = set(c.lower() for c in actual_columns) - set(c.lower() for c in expected_columns)

                if not missing and not extra:
                    return "PASS", f"Schema correct: {', '.join(actual_columns)}", 1.0
                elif missing:
                    return "FAIL", f"Missing columns: {', '.join(missing)}", 0.0
                else:
                    return "PARTIAL", f"Extra columns: {', '.join(extra)}", 0.5
            else:
                return "PASS", f"Schema has columns: {', '.join(actual_columns)}", 1.0

        except Exception as e:
            verification_logger.error(f"Schema check failed: {e}")
            return "FAIL", f"Failed to verify schema: {str(e)}", 0.0

    async def _verify_row_count(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify row count meets requirements.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            description = criterion_config.get("description", "")

            # Parse data
            data = self._parse_csv_data(text) or self._parse_json_data(text)

            row_count = len(data)

            # Get expected row count from description
            import re
            match = re.search(r'(\d+)\s*-\s*(\d+)\s*rows?', description.lower())
            if match:
                min_rows = int(match.group(1))
                max_rows = int(match.group(2))
            else:
                min_rows, max_rows = 10, 10000  # Default

            if min_rows <= row_count <= max_rows:
                return "PASS", f"Row count ({row_count}) within range ({min_rows}-{max_rows})", 1.0
            elif row_count < min_rows:
                return "FAIL", f"Row count ({row_count}) below minimum ({min_rows})", 0.0
            else:
                return "PARTIAL", f"Row count ({row_count}) exceeds maximum ({max_rows})", 0.5

        except Exception as e:
            verification_logger.error(f"Row count check failed: {e}")
            return "FAIL", f"Failed to verify row count: {str(e)}", 0.0

    async def _verify_column_count(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify column count meets requirements.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            description = criterion_config.get("description", "")

            # Parse data
            data = self._parse_csv_data(text) or self._parse_json_data(text)

            if not data:
                return "FAIL", "No data to check columns", 0.0

            column_count = len(data[0].keys()) if data else 0

            # Get expected column count from description
            import re
            match = re.search(r'(\d+)\s*columns?', description.lower())
            expected_columns = int(match.group(1)) if match else None

            if expected_columns:
                if column_count == expected_columns:
                    return "PASS", f"Column count correct: {column_count}", 1.0
                else:
                    return "FAIL", f"Column count ({column_count}) does not match expected ({expected_columns})", 0.0
            else:
                return "PASS", f"Column count: {column_count}", 1.0

        except Exception as e:
            verification_logger.error(f"Column count check failed: {e}")
            return "FAIL", f"Failed to verify column count: {str(e)}", 0.0

    async def _verify_data_types(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify data types match requirements.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            description = criterion_config.get("description", "")

            # Parse data
            data = self._parse_csv_data(text) or self._parse_json_data(text)

            if not data:
                return "FAIL", "No data to check", 0.0

            # Get expected types from description
            import re
            type_requirements = re.findall(r'(\w+)\s+should\s+be\s+(\w+)', description.lower())

            if not type_requirements:
                return "PASS", "No specific data type requirements", 1.0

            issues = []
            for col_name, expected_type in type_requirements:
                for row in data[:100]:  # Check first 100 rows
                    value = row.get(col_name)
                    if value is None:
                        continue

                    if expected_type == "integer":
                        try:
                            int(value)
                        except (ValueError, TypeError):
                            issues.append(f"Column '{col_name}' has non-integer values")
                            break
                    elif expected_type == "float" or expected_type == "decimal" or expected_type == "number":
                        try:
                            float(value)
                        except (ValueError, TypeError):
                            issues.append(f"Column '{col_name}' has non-numeric values")
                            break
                    elif expected_type == "string" or expected_type == "text":
                        if not isinstance(value, str):
                            issues.append(f"Column '{col_name}' has non-string values")
                            break

            if not issues:
                return "PASS", "All data types match requirements", 1.0
            else:
                return "FAIL", "; ".join(issues[:5]), 0.0

        except Exception as e:
            verification_logger.error(f"Data type check failed: {e}")
            return "FAIL", f"Failed to verify data types: {str(e)}", 0.0

    async def _verify_data_accuracy(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify data accuracy using AI.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            description = criterion_config.get("description", "")

            # Sample data for verification
            data = self._parse_csv_data(text) or self._parse_json_data(text)

            if not data:
                return "FAIL", "No data to check", 0.0

            sample_size = min(20, len(data))
            sample_data = data[:sample_size]

            prompt = f"""
            Analyze this sample data for accuracy and consistency issues.

            Description: {description}

            Sample data (first {sample_size} rows):
            {json.dumps(sample_data, indent=2)}

            Respond in JSON format:
            {{
                "has_accuracy_issues": true/false,
                "accuracy_score": 0-100,
                "issues_found": ["list of specific issues"],
                "suggestions": ["list of improvements"],
                "explanation": "Brief explanation"
            }}
            """

            system_prompt = "You are a data quality expert. Identify accuracy and consistency issues."

            response = await openrouter_client.generate_json_completion(prompt, system_prompt)

            if not response.get("has_accuracy_issues"):
                return "PASS", f"Data accuracy score: {response.get('accuracy_score')}%", 1.0

            score = response.get("accuracy_score", 80)
            if score >= 80:
                return "PASS", f"Good data accuracy: {score}%", 1.0
            elif score >= 60:
                return "PARTIAL", f"Adequate data accuracy: {score}%", 0.5
            else:
                return "FAIL", f"Poor data accuracy: {score}%", 0.0

        except Exception as e:
            verification_logger.error(f"Data accuracy check failed: {e}")
            return "FAIL", f"Failed to verify data accuracy: {str(e)}", 0.0

    async def _verify_duplicates(self, text: str) -> tuple[str, str, float]:
        """Verify no duplicate data.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            # Parse data
            data = self._parse_csv_data(text) or self._parse_json_data(text)

            if not data:
                return "FAIL", "No data to check", 0.0

            # Convert rows to tuples for comparison
            rows = [tuple(row.items()) for row in data]
            unique_rows = set(rows)

            duplicate_count = len(rows) - len(unique_rows)

            if duplicate_count == 0:
                return "PASS", "No duplicate rows found", 1.0
            else:
                duplicate_percentage = (duplicate_count / len(rows)) * 100
                if duplicate_percentage < 5:
                    return "INFO", f"Minor duplicates: {duplicate_count} rows ({duplicate_percentage:.1f}%)", 1.0
                else:
                    return "FAIL", f"Many duplicates: {duplicate_count} rows ({duplicate_percentage:.1f}%)", 0.0

        except Exception as e:
            verification_logger.error(f"Duplicate check failed: {e}")
            return "FAIL", f"Failed to verify duplicates: {str(e)}", 0.0

    async def _verify_missing_values(self, text: str) -> tuple[str, str, float]:
        """Verify minimal missing values.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            # Parse data
            data = self._parse_csv_data(text) or self._parse_json_data(text)

            if not data:
                return "FAIL", "No data to check", 0.0

            total_values = len(data) * len(data[0].keys()) if data else 0
            missing_values = 0

            for row in data:
                for value in row.values():
                    if value is None or value == "" or str(value).strip() == "":
                        missing_values += 1

            if total_values == 0:
                return "PASS", "No data to check", 1.0

            missing_percentage = (missing_values / total_values) * 100

            if missing_percentage == 0:
                return "PASS", "No missing values", 1.0
            elif missing_percentage < 5:
                return "INFO", f"Minimal missing values: {missing_percentage:.1f}%", 1.0
            elif missing_percentage < 20:
                return "PARTIAL", f"Some missing values: {missing_percentage:.1f}%", 0.5
            else:
                return "FAIL", f"Excessive missing values: {missing_percentage:.1f}%", 0.0

        except Exception as e:
            verification_logger.error(f"Missing values check failed: {e}")
            return "FAIL", f"Failed to verify missing values: {str(e)}", 0.0

    async def _verify_formatting(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify data formatting.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            description = criterion_config.get("description", "")

            # Check if data is CSV
            is_csv = text.strip().startswith(("ID,", "id,", '"id"', '"ID"'))

            # Check if data is JSON
            try:
                json.loads(text)
                is_json = True
            except:
                is_json = False

            # Get expected format from description
            if "csv" in description.lower():
                if is_csv:
                    return "PASS", "Correct CSV format", 1.0
                elif is_json:
                    return "FAIL", "Expected CSV, received JSON", 0.0
                else:
                    return "FAIL", "Unknown format, expected CSV", 0.0
            elif "json" in description.lower():
                if is_json:
                    return "PASS", "Correct JSON format", 1.0
                elif is_csv:
                    return "FAIL", "Expected JSON, received CSV", 0.0
                else:
                    return "FAIL", "Unknown format, expected JSON", 0.0
            else:
                return "PASS", f"Format: {'CSV' if is_csv else 'JSON' if is_json else 'unknown'}", 1.0

        except Exception as e:
            verification_logger.error(f"Formatting check failed: {e}")
            return "FAIL", f"Failed to verify formatting: {str(e)}", 0.0

    async def _verify_consistency(self, text: str, criterion_config: Dict[str, Any]) -> tuple[str, str, float]:
        """Verify data consistency.

        Returns:
            Tuple of (status, detail, score)
        """
        try:
            # Parse data
            data = self._parse_csv_data(text) or self._parse_json_data(text)

            if not data or len(data) < 2:
                return "PASS", "Not enough data to check consistency", 1.0

            # Check for inconsistent formats in similar columns
            issues = []
            columns = list(data[0].keys())

            for col in columns:
                values = [row.get(col) for row in data if row.get(col) is not None]
                if not values:
                    continue

                # Check for mixed types
                types = set(type(v).__name__ for v in values if v != "")
                if len(types) > 2:
                    issues.append(f"Column '{col}' has mixed types: {', '.join(types)}")

            if not issues:
                return "PASS", "Data is consistent", 1.0
            else:
                return "PARTIAL", f"Consistency issues: {'; '.join(issues[:3])}", 0.5

        except Exception as e:
            verification_logger.error(f"Consistency check failed: {e}")
            return "FAIL", f"Failed to verify consistency: {str(e)}", 0.0

    def get_criterion_status(self, name: str, result: tuple) -> tuple[str, str, float]:
        """Determine criterion status based on verification result."""
        status, detail, score = result
        return status, detail, score
