"""
QuantumTestingFramework — Adaptive quantum hardware testing with
error correction, environmental monitoring, stability analysis,
and classical cross-validation.
"""

from collections import deque
import time
import logging
import concurrent.futures

import numpy as np
from scipy.stats import linregress, kendalltau

from .operations import (
    generate_adaptive_scenario,
    apply_quantum_error_mitigation,
    execute_scenario,
    execute_scenario_with_ecc,
    update_reality_models,
    trigger_quantum_emergency_protocol,
    scale_scenario,
    apply_error_correction_strategy,
    compare_results,
    update_entanglement_models,
)


class QuantumHardwareException(Exception):
    """Raised when quantum hardware encounters an unrecoverable error."""

    def __init__(self, message, error_code=0):
        super().__init__(message)
        self.error_code = error_code
        self.timestamp = time.time()

    def __str__(self):
        return f"[{self.error_code}] {super().__str__()} @ {self.timestamp}"


class QuantumTestingFramework:
    """
    Adaptive testing framework for quantum computers.

    Continuously generates and executes test scenarios while monitoring
    hardware stability, adjusting error correction levels, and performing
    preventive maintenance.

    Args:
        quantum_computer: Hardware interface with calibration and diagnostics.
        anomaly_db: Database for tracking anomaly patterns and correlations.
        classical_simulator: Optional classical backend for cross-validation.
    """

    # ─── Error Correction Code Registry ────────────────────
    ERROR_CORRECTION_CODES = {
        1: 'Surface-17',
        2: 'Bacon-Shor-13',
        3: 'Color-9',
    }

    def __init__(self, quantum_computer, anomaly_db, classical_simulator=None):
        self.quantum_computer = quantum_computer
        self.anomaly_db = anomaly_db
        self.classical_simulator = classical_simulator
        self.test_history = deque(maxlen=150)
        self.safety_threshold = 0.4
        self.consecutive_failures = 0
        self.last_execution_time = time.time()
        self.degradation_warning_issued = False
        self.quantum_error_correction = True
        self.error_correction_level = 1

        # Configurable parameters
        self.COOLDOWN_PERIOD = 0.5
        self.CONSECUTIVE_FAILURE_LIMIT = 3
        self.ANOMALY_REG_THRESHOLD = 0.7
        self.STABILITY_WINDOW = 20
        self.THRESHOLD_HYSTERESIS = 0.02
        self.QUBIT_STABILITY_THRESHOLD = 0.85
        self.ENVIRONMENT_SENSITIVITY = 0.05
        self.CROSS_VALIDATION_PROBABILITY = 0.2
        self.RESOURCE_AWARENESS_FACTOR = 0.8

        self.logger = self._setup_logger()

    # ─── Logger ────────────────────────────────────────────

    @staticmethod
    def _setup_logger():
        logger = logging.getLogger('QuantumTester')
        if not logger.handlers:
            logger.setLevel(logging.INFO)
            handler = logging.StreamHandler()
            fmt = '%(asctime)s - %(levelname)s - [Qubits:%(qubits)d|ECC:%(ecc)s] %(message)s'
            handler.setFormatter(logging.Formatter(fmt))
            logger.addHandler(handler)
        return logger

    def _log_extras(self, qubits=None):
        return {
            'qubits': qubits or self.quantum_computer.active_qubits,
            'ecc': self.ERROR_CORRECTION_CODES.get(self.error_correction_level, 'None'),
        }

    # ─── Main Test Cycle ───────────────────────────────────

    def run_adaptive_test_cycle(self):
        """
        Execute the continuous adaptive test loop.

        Runs until the quantum computer is no longer operational or
        an unrecoverable error is encountered.
        """
        cycle_count = 0
        resource_usage = 0

        while self.quantum_computer.operational:
            try:
                cycle_count += 1

                # Environmental stability check
                env_status = self.check_quantum_environment()
                if not env_status['stable']:
                    self._handle_environment_instability(env_status)
                    continue

                # Generate and execute scenario
                scenario = self._generate_resource_aware_scenario(resource_usage)
                result = self._execute_scenario_with_safety(scenario)

                # Cross-validation
                if (self.classical_simulator
                        and np.random.random() < self.CROSS_VALIDATION_PROBABILITY):
                    self._cross_validate_with_classical(result, scenario)

                # Update systems and track resources
                self._update_system_models(result)
                self.test_history.append(result)
                resource_usage += scenario.qubit_count * scenario.execution_time

                # Failure handling
                if self._handle_failure_conditions(result):
                    return

                # System analysis and maintenance
                self._adjust_safety_threshold()
                self.analyze_multi_dimensional_stability()

                # Periodic calibration
                if cycle_count % self._get_calibration_interval() == 0:
                    self.perform_adaptive_calibration()

                self._adjust_error_correction_level()

                # Advanced quantum monitoring
                if cycle_count % 5 == 0 and len(self.test_history) >= 4:
                    self.track_entanglement_evolution()
                if cycle_count % 20 == 0 and len(self.test_history) >= 20:
                    self.detect_quantum_anomaly_correlation()

            except QuantumHardwareException as e:
                self._handle_quantum_error(e)
                return
            except Exception as e:
                self.logger.error(f"Unexpected error: {e}", extra=self._log_extras())
                self._trigger_graceful_shutdown(reason=f"System error: {e}")
                return

    # ─── Cooldown Calculation ──────────────────────────────

    def calculate_quantum_cooldown(self):
        """Compute adaptive cooldown based on hardware and test state."""
        factors = []

        # Temperature factor
        if self.quantum_computer.qubit_temperature > 0.015:
            factors.append(min(3.0, np.exp(self.quantum_computer.qubit_temperature - 0.015)))

        # Entanglement factor
        if self.test_history:
            entropy = self.test_history[-1].entanglement_entropy
            if entropy > 2.0:
                factors.append(1.5)
            elif entropy > 1.5:
                factors.append(1.2)

        # Failure factor
        if self.consecutive_failures > 0:
            factors.append(1 + 0.25 * self.consecutive_failures)

        # Decoherence factor
        if self.test_history and self.test_history[-1].decoherence_rate > 0.12:
            factors.append(1.3)

        composite = np.prod(factors) if factors else 1.0
        elapsed = time.time() - self.last_execution_time
        return max(0, self.COOLDOWN_PERIOD * composite - elapsed)

    # ─── Environment Monitoring ────────────────────────────

    def check_quantum_environment(self):
        """Assess current quantum hardware environment stability."""
        status = {'stable': True, 'issues': []}
        qc = self.quantum_computer

        if qc.qubit_coherence < self.QUBIT_STABILITY_THRESHOLD:
            status['stable'] = False
            status['issues'].append(('coherence', qc.qubit_coherence))

        if qc.environmental_stability < 0.9:
            status['stable'] = False
            status['issues'].append(('environment', qc.environmental_stability))

        if self.test_history and len(self.test_history) > 3:
            last = self.test_history[-1].entanglement_entropy
            avg = np.mean([r.entanglement_entropy for r in list(self.test_history)[-3:]])
            if last < 0.7 * avg:
                status['stable'] = False
                status['issues'].append(('entanglement', last / avg))

        if qc.vacuum_level >= 1e-10:
            status['stable'] = False
            status['issues'].append(('vacuum', qc.vacuum_level))

        return status

    def _handle_environment_instability(self, env_status):
        cooldown_multiplier = 1.0
        labels = {
            'coherence': lambda v: f"Low qubit coherence: {v:.3f}",
            'environment': lambda v: f"Environmental instability: {v:.3f}",
            'entanglement': lambda v: f"Entanglement degradation: {v:.2f}x",
            'vacuum': lambda v: f"Vacuum instability: {v:.1e} Torr",
        }
        for issue_type, value in env_status['issues']:
            self.logger.warning(labels[issue_type](value), extra=self._log_extras())
            if issue_type in ('coherence', 'vacuum'):
                cooldown_multiplier *= 2.0

        pause = 2.0 * cooldown_multiplier
        self.logger.info(f"Pausing tests for {pause:.1f}s", extra=self._log_extras())
        time.sleep(pause)

    # ─── Scenario Generation ──────────────────────────────

    def _generate_resource_aware_scenario(self, resource_usage):
        noise = self.quantum_computer.get_current_noise_profile()
        pressure = min(1.0, resource_usage / 100_000)

        base = generate_adaptive_scenario(
            previous_results=list(self.test_history),
            failure_patterns=self.anomaly_db.get_contextual_patterns(
                current_state=self.quantum_computer.calibration_status,
                noise_profile=noise,
            ),
            quantum_state=self.quantum_computer.get_quantum_state(),
            noise_model=noise,
        )

        scaled = self._scale_scenario(base, pressure)

        if self.quantum_error_correction:
            scaled = apply_error_correction_strategy(
                scaled, self.ERROR_CORRECTION_CODES[self.error_correction_level]
            )

        return scaled

    def _scale_scenario(self, scenario, pressure):
        factor = max(0.5, 1 - pressure * self.RESOURCE_AWARENESS_FACTOR)
        target_qubits = int(scenario.qubit_count * factor)
        target_depth = int(scenario.circuit_depth * max(0.7, 1 - pressure * self.RESOURCE_AWARENESS_FACTOR * 0.8))
        return scale_scenario(scenario, target_qubits, target_depth, resource_constraint=True)

    # ─── Scenario Execution ───────────────────────────────

    def _execute_scenario_with_safety(self, scenario):
        cooldown = self.calculate_quantum_cooldown()
        time.sleep(cooldown)

        if not self.quantum_computer.quantum_preflight_check():
            raise QuantumHardwareException("Quantum preflight check failed")

        scenario = apply_quantum_error_mitigation(
            scenario, self.quantum_computer.error_mitigation_strategy
        )

        if self.quantum_error_correction:
            result = execute_scenario_with_ecc(scenario, self.error_correction_level)
        else:
            result = execute_scenario(scenario)

        result.timestamp = time.time()
        self.last_execution_time = result.timestamp
        result.ecc_level = self.error_correction_level if self.quantum_error_correction else 0

        if result.decoherence_rate > 0.15:
            self.logger.warning(
                f"High decoherence: {result.decoherence_rate:.3f}",
                extra=self._log_extras(scenario.qubit_count),
            )

        return result

    # ─── Cross-Validation ─────────────────────────────────

    def _cross_validate_with_classical(self, quantum_result, scenario):
        try:
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(self.classical_simulator.simulate, scenario)
                timeout = min(60, 10 + scenario.qubit_count * 0.2)
                classical_result = future.result(timeout=timeout)

            fidelity = compare_results(quantum_result, classical_result)

            if fidelity < 0.95:
                self.logger.warning(
                    f"Quantum-classical discrepancy: {fidelity:.3f} fidelity",
                    extra=self._log_extras(scenario.qubit_count),
                )
                if fidelity < 0.85:
                    self.anomaly_db.register_discrepancy(quantum_result, classical_result, scenario)

            quantum_result.cross_validation_fidelity = fidelity

        except (TimeoutError, concurrent.futures.TimeoutError):
            self.logger.warning("Classical validation timed out", extra=self._log_extras(scenario.qubit_count))
        except Exception as e:
            self.logger.error(f"Classical validation failed: {e}", extra=self._log_extras(scenario.qubit_count))

    # ─── Failure Handling ─────────────────────────────────

    def _handle_failure_conditions(self, result):
        ecc_factor = 1.1 ** (self.error_correction_level - 1)
        effective_threshold = self.safety_threshold * ecc_factor

        if result.integrity_score < effective_threshold:
            self.consecutive_failures += 1
            if self.consecutive_failures >= self.CONSECUTIVE_FAILURE_LIMIT:
                self._trigger_graceful_shutdown(
                    reason=f"Persistent instability (ECC L{self.error_correction_level}): "
                           f"{result.integrity_score:.2f}"
                )
                return True
        else:
            self.consecutive_failures = 0

        collapse_threshold = max(0.25, 0.3 - self.error_correction_level * 0.05)
        if result.state_fidelity < collapse_threshold:
            self.logger.critical("Quantum state collapse detected!", extra=self._log_extras(result.qubit_count))
            self._trigger_graceful_shutdown(reason="Quantum state collapse")
            return True

        return False

    # ─── Stability Analysis ───────────────────────────────

    def analyze_multi_dimensional_stability(self):
        """Assess system stability across integrity, fidelity, decoherence, and gate error."""
        if len(self.test_history) < self.STABILITY_WINDOW:
            return

        w = self.STABILITY_WINDOW
        metrics = {
            'integrity': [r.integrity_score for r in self.test_history][-w:],
            'fidelity': [r.state_fidelity for r in self.test_history][-w:],
            'decoherence': [r.decoherence_rate for r in self.test_history][-w:],
            'gate_error': [r.avg_gate_error for r in self.test_history][-w:],
        }

        index = self._composite_stability_index(metrics)
        self.logger.info(f"Stability index={index:.3f} (0=stable, 1=critical)", extra=self._log_extras())

        if index > 0.7:
            self.logger.warning("Critical stability degradation!", extra=self._log_extras())
            self._trigger_preventive_actions(index)

    @staticmethod
    def _composite_stability_index(metrics):
        weights = {'integrity': 0.4, 'fidelity': 0.3, 'decoherence': 0.2, 'gate_error': 0.1}
        score = 0.0
        for name, values in metrics.items():
            tau, _ = kendalltau(range(len(values)), values)
            trend = (1 - abs(tau)) / 2
            mean = np.mean(values)
            vol = np.std(values) / mean if mean > 0 else 1
            metric_score = 0.7 * trend + 0.3 * (1 - min(1, vol))
            score += weights[name] * (1 - metric_score)
        return min(1.0, score)

    def _trigger_preventive_actions(self, stability_index):
        if self.quantum_error_correction and self.error_correction_level < 3:
            new = min(3, self.error_correction_level + 1)
            self.logger.info(f"Raising ECC {self.error_correction_level}\u2192{new}", extra=self._log_extras())
            self.error_correction_level = new

        self.COOLDOWN_PERIOD = min(1.5, self.COOLDOWN_PERIOD * 1.3)
        self.RESOURCE_AWARENESS_FACTOR = max(0.5, self.RESOURCE_AWARENESS_FACTOR * 0.9)

        if stability_index > 0.85:
            self.logger.warning("Emergency calibration triggered", extra=self._log_extras())
            self.perform_adaptive_calibration(emergency=True)

    # ─── Error Correction ─────────────────────────────────

    def _adjust_error_correction_level(self):
        if len(self.test_history) < 10:
            return
        recent = [r.logical_error_rate for r in self.test_history][-10:]
        avg = np.mean(recent)
        if avg < 0.01 and self.error_correction_level > 1:
            self.error_correction_level -= 1
        elif avg > 0.05 and self.error_correction_level < 3:
            self.error_correction_level += 1

    # ─── Calibration ──────────────────────────────────────

    def _get_calibration_interval(self):
        base = 50
        if self.consecutive_failures > 0:
            return max(10, base - self.consecutive_failures * 10)
        if len(self.test_history) > 20:
            scores = [r.integrity_score for r in self.test_history][-20:]
            if np.mean(scores) > 0.8 and np.std(scores) < 0.05:
                return min(100, base + 30)
        return base

    def perform_adaptive_calibration(self, emergency=False):
        """Calibrate quantum hardware with adaptive intensity."""
        intensity = 'emergency' if emergency else ('enhanced' if self.consecutive_failures > 0 else 'standard')
        self.logger.info(f"Calibrating ({intensity})...", extra=self._log_extras())

        result = self.quantum_computer.perform_calibration(intensity)

        if result.success:
            self.logger.info(
                f"Calibration OK: fidelity +{result.fidelity_improvement:.4f}",
                extra=self._log_extras(),
            )
            self.degradation_warning_issued = False
            if intensity == 'emergency':
                self.COOLDOWN_PERIOD = max(0.3, self.COOLDOWN_PERIOD * 0.8)
                self.safety_threshold = min(0.5, self.safety_threshold + 0.05)
        else:
            self.logger.error(f"Calibration failed ({intensity})", extra=self._log_extras())
            if not emergency:
                self.perform_adaptive_calibration(emergency=True)

    # ─── Safety Threshold ─────────────────────────────────

    def _adjust_safety_threshold(self):
        if len(self.test_history) < self.STABILITY_WINDOW:
            return
        w = self.STABILITY_WINDOW
        scores = [r.integrity_score for r in list(self.test_history)[-w:]]
        decoherence = [r.decoherence_rate for r in list(self.test_history)[-w:]]
        avg = np.mean(scores)
        stability = np.mean(decoherence) * 2 + np.std(scores) / avg

        if stability > 0.25:
            self.safety_threshold = min(0.55, self.safety_threshold + stability * self.THRESHOLD_HYSTERESIS)
        elif stability < 0.1 and self.safety_threshold > 0.4:
            self.safety_threshold = max(0.35, self.safety_threshold - 0.5 * self.THRESHOLD_HYSTERESIS)

    # ─── Model Updates ────────────────────────────────────

    def _update_system_models(self, result):
        update_reality_models(result)
        if result.error_characteristics:
            self.quantum_computer.update_error_model(result.error_characteristics)
        if result.quantum_anomaly_signature and result.integrity_score < self.ANOMALY_REG_THRESHOLD:
            self.anomaly_db.register_quantum_pattern(
                result.quantum_anomaly_signature,
                context={
                    'environment': self.quantum_computer.current_environment,
                    'calibration': self.quantum_computer.calibration_status,
                    'noise_profile': self.quantum_computer.get_current_noise_profile(),
                },
            )

    # ─── Entanglement Tracking ────────────────────────────

    def track_entanglement_evolution(self):
        """Monitor entanglement entropy propagation and quantum Darwinism patterns."""
        entropies = [r.entanglement_entropy for r in self.test_history if hasattr(r, 'entanglement_entropy')]
        if len(entropies) < 4:
            return

        propagation = [entropies[i] / entropies[i - 1] for i in range(1, len(entropies)) if entropies[i - 1] > 0]
        if not propagation:
            return

        avg_prop = np.mean(propagation)
        prop_std = np.std(propagation)
        dist_var = np.var(entropies[-4:])
        darwinism = kendalltau(entropies, range(len(entropies)))[0] if len(entropies) > 10 else 0.0

        if dist_var > 0.5:
            self.logger.warning(f"High entanglement variance: {dist_var:.3f}", extra=self._log_extras())
        if prop_std > 0.3:
            self.logger.warning(f"Unstable propagation: \u03c3={prop_std:.3f}", extra=self._log_extras())
        if darwinism < -0.4:
            self.logger.info("Quantum Darwinism pattern detected", extra=self._log_extras())

        update_entanglement_models({
            'avg_propagation': avg_prop,
            'propagation_std': prop_std,
            'distribution_variance': dist_var,
            'darwinism_factor': darwinism,
        })

    # ─── Anomaly Correlation ──────────────────────────────

    def detect_quantum_anomaly_correlation(self):
        """Detect statistical correlations between anomalies and hardware metrics."""
        if len(self.test_history) < 20:
            return

        anomalies, temps, decoherences, fidelities, entropies = [], [], [], [], []
        for r in self.test_history:
            anomalies.append(1 if r.anomaly_signature else 0)
            temps.append(r.temperature)
            decoherences.append(r.decoherence_rate)
            fidelities.append(r.state_fidelity)
            entropies.append(r.entanglement_entropy if hasattr(r, 'entanglement_entropy') else 0)

        if len(entropies) < len(anomalies):
            entropies += [np.mean(entropies)] * (len(anomalies) - len(entropies))

        data = np.array([anomalies, temps, decoherences, fidelities, entropies])
        corr = np.corrcoef(data)
        names = ['anomalies', 'temperature', 'decoherence', 'fidelity', 'entropy']

        significant = {}
        for i in range(len(names)):
            for j in range(i + 1, len(names)):
                if abs(corr[i, j]) > 0.5:
                    significant[f"{names[i]}-{names[j]}"] = corr[i, j]

        if significant:
            self.anomaly_db.update_correlation_map(significant)
            self.logger.info(f"Correlations: {significant}", extra=self._log_extras())

    # ─── Reporting ────────────────────────────────────────

    def generate_stability_report(self):
        """Generate a comprehensive stability report."""
        if len(self.test_history) < 10:
            return {'status': 'insufficient_data'}

        report = {
            'last_20_integrity': [r.integrity_score for r in list(self.test_history)[-20:]],
            'avg_fidelity': np.mean([r.state_fidelity for r in self.test_history]),
            'trends': self._trend_metrics(),
            'resources': self._resource_utilization(),
            'anomaly_count': sum(1 for r in self.test_history if r.anomaly_signature),
            'ecc_effectiveness': self._ecc_effectiveness(),
            'environment_stability': self.quantum_computer.get_environmental_report(),
        }
        report['stability_score'] = self._stability_score(report)
        return report

    def _trend_metrics(self):
        if len(self.test_history) < 10:
            return {}
        window = min(50, len(self.test_history))
        recent = list(self.test_history)[-window:]
        metrics = {}
        for attr in ['integrity_score', 'state_fidelity', 'decoherence_rate', 'entanglement_entropy']:
            values = [getattr(r, attr, None) for r in recent]
            values = [v for v in values if v is not None]
            if len(values) > 1:
                slope, _, r_val, _, _ = linregress(np.arange(len(values)), values)
                metrics[attr] = {'slope': slope, 'r_squared': r_val ** 2, 'last_5_avg': np.mean(values[-5:])}
        return metrics

    def _resource_utilization(self):
        if not self.test_history:
            return {}
        qubits = [r.qubit_count for r in self.test_history]
        durations = [r.execution_time for r in self.test_history]
        ecc_levels = [getattr(r, 'ecc_level', 0) for r in self.test_history]
        return {
            'total_qubit_seconds': sum(q * t for q, t in zip(qubits, durations)),
            'avg_qubits': np.mean(qubits),
            'max_qubits': max(qubits),
            'avg_duration': np.mean(durations),
            'avg_ecc_level': np.mean(ecc_levels),
        }

    def _ecc_effectiveness(self):
        if not self.quantum_error_correction or len(self.test_history) < 20:
            return {}
        by_level = {}
        for r in self.test_history:
            by_level.setdefault(getattr(r, 'ecc_level', 0), []).append(r)

        effectiveness = {}
        for level, results in by_level.items():
            if level == 0 or len(results) < 5:
                continue
            logical = np.array([r.logical_error_rate for r in results])
            physical = np.array([r.physical_error_rate for r in results])
            suppression = np.mean(physical) / np.mean(logical) if np.mean(logical) > 0 else 0
            ci = 1.96 * np.std(logical) / np.sqrt(len(results))

            fidelity_improvement = 0
            if 0 in by_level and len(by_level[0]) >= 5:
                fidelity_improvement = np.mean([r.state_fidelity for r in results]) - np.mean(
                    [r.state_fidelity for r in by_level[0]])

            effectiveness[level] = {
                'suppression_factor': suppression,
                'fidelity_improvement': fidelity_improvement,
                'avg_logical_error': np.mean(logical),
                'confidence_interval': ci,
                'sample_size': len(results),
            }
        return effectiveness

    @staticmethod
    def _stability_score(report):
        if 'trends' not in report or not report['trends']:
            return 0.0
        weights = {'integrity_score': 0.35, 'state_fidelity': 0.30, 'decoherence_rate': 0.20, 'entanglement_entropy': 0.15}
        score, total_w = 0.0, 0.0
        for metric, w in weights.items():
            if metric in report['trends']:
                d = report['trends'][metric]
                trend_f = max(0, 1 - np.tanh(-d['slope'] * 100))
                if metric != 'decoherence_rate':
                    recent_f = min(1.0, d['last_5_avg'] / 0.8)
                else:
                    recent_f = min(1.0, 0.2 / d['last_5_avg']) if d['last_5_avg'] > 0 else 1.0
                score += w * (0.6 * trend_f + 0.4 * recent_f)
                total_w += w
        if isinstance(report.get('environment_stability'), (int, float)):
            score = 0.8 * score + 0.2 * min(1.0, report['environment_stability'] / 0.95)
        return max(0.0, min(1.0, score / total_w)) if total_w > 0 else 0.0

    # ─── Shutdown ─────────────────────────────────────────

    def _trigger_graceful_shutdown(self, reason):
        self.logger.critical(f"SHUTDOWN: {reason}", extra=self._log_extras())
        trigger_quantum_emergency_protocol(
            reason=reason,
            diagnostics=self.quantum_computer.capture_quantum_diagnostics(),
            quantum_state=self.quantum_computer.get_quantum_state(),
            stability_report=self.generate_stability_report(),
            last_results=list(self.test_history)[-5:],
            ecc_level=self.error_correction_level,
        )
        self.quantum_computer.quantum_safe_shutdown()
        self.quantum_computer.operational = False

    def _handle_quantum_error(self, exception):
        self.logger.critical(f"Hardware exception: {exception}", extra=self._log_extras())
        self._trigger_graceful_shutdown(reason=f"Quantum error: {exception}")
