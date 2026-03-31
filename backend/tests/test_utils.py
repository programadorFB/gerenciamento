"""Testes unitários das funções utilitárias (app/utils.py)."""
import pytest
from decimal import Decimal
from app.utils import (
    calculate_profit_loss,
    calculate_roi,
    calculate_win_rate,
    calculate_drawdown,
    assess_risk_level,
    calculate_position_size,
    get_profile_recommendations,
    get_period_start_date,
    format_duration,
    validate_email,
    validate_password_strength,
    validate_transaction_amount,
    generate_session_id,
    format_currency,
    format_percentage,
    parse_currency_input,
    calculate_moving_average,
    generate_performance_insights,
)


class TestFinancialCalculations:

    def test_profit_loss_positive(self):
        result = calculate_profit_loss(Decimal('1000'), Decimal('1500'))
        assert result == Decimal('500')

    def test_profit_loss_negative(self):
        result = calculate_profit_loss(Decimal('1000'), Decimal('700'))
        assert result == Decimal('-300')

    def test_profit_loss_with_withdrawals(self):
        result = calculate_profit_loss(Decimal('1000'), Decimal('1200'), Decimal('300'))
        assert result == Decimal('-100')

    def test_roi_positive(self):
        result = calculate_roi(Decimal('1000'), Decimal('1500'))
        assert result == Decimal('50.00')

    def test_roi_zero_investment(self):
        result = calculate_roi(Decimal('0'), Decimal('500'))
        assert result == Decimal('0')

    def test_roi_negative(self):
        result = calculate_roi(Decimal('1000'), Decimal('800'))
        assert result == Decimal('-20.00')

    def test_win_rate_basic(self):
        assert calculate_win_rate(7, 10) == Decimal('70.00')

    def test_win_rate_no_sessions(self):
        assert calculate_win_rate(0, 0) == Decimal('0')

    def test_win_rate_all_wins(self):
        assert calculate_win_rate(10, 10) == Decimal('100.00')

    def test_drawdown(self):
        result = calculate_drawdown(Decimal('1500'), Decimal('1200'))
        assert result['amount'] == Decimal('300.00')
        assert result['percentage'] == Decimal('20.00')

    def test_drawdown_zero_peak(self):
        result = calculate_drawdown(Decimal('0'), Decimal('100'))
        assert result['amount'] == Decimal('0')


class TestRiskManagement:

    def test_risk_critical(self):
        result = assess_risk_level(Decimal('500'), Decimal('1000'), Decimal('600'))
        assert result['level'] == 'critical'

    def test_risk_high(self):
        result = assess_risk_level(Decimal('620'), Decimal('1000'), Decimal('600'))
        assert result['level'] == 'high'

    def test_risk_low(self):
        result = assess_risk_level(Decimal('900'), Decimal('1000'), Decimal('500'))
        assert result['level'] == 'low'

    def test_risk_undefined_no_stop_loss(self):
        result = assess_risk_level(Decimal('1000'), Decimal('1000'), Decimal('0'))
        assert result['level'] == 'undefined'

    def test_position_size(self):
        result = calculate_position_size(Decimal('10000'), Decimal('2'), Decimal('5'))
        assert result == Decimal('4000.00')

    def test_position_size_zero_stop(self):
        result = calculate_position_size(Decimal('10000'), Decimal('2'), Decimal('0'))
        assert result == Decimal('0')


class TestProfileRecommendations:

    def test_cautious_profile(self):
        rec = get_profile_recommendations(2)
        assert rec['profile_type'] == 'cautious'
        assert rec['max_bet_percentage'] == 2

    def test_balanced_profile(self):
        rec = get_profile_recommendations(5)
        assert rec['profile_type'] == 'balanced'

    def test_aggressive_profile(self):
        rec = get_profile_recommendations(9)
        assert rec['profile_type'] == 'aggressive'
        assert rec['max_bet_percentage'] == 10


class TestDateUtilities:

    def test_format_duration_seconds(self):
        assert format_duration(45) == '45s'

    def test_format_duration_minutes(self):
        assert format_duration(150) == '2m'

    def test_format_duration_hours(self):
        assert format_duration(7500) == '2h 5m'

    def test_period_start_today(self):
        from datetime import datetime
        result = get_period_start_date('today')
        assert result.hour == 0
        assert result.date() == datetime.utcnow().date()

    def test_period_start_default(self):
        from datetime import datetime, timedelta
        result = get_period_start_date('unknown')
        assert (datetime.utcnow() - result).days <= 31


class TestValidation:

    def test_valid_email(self):
        assert validate_email('user@example.com') is True
        assert validate_email('test.user+tag@domain.co.uk') is True

    def test_invalid_email(self):
        assert validate_email('not-an-email') is False
        assert validate_email('@nope.com') is False
        assert validate_email('') is False

    def test_strong_password(self):
        result = validate_password_strength('S3nha@Fort3!')
        assert result['is_valid'] is True
        assert result['score'] >= 3

    def test_weak_password(self):
        result = validate_password_strength('123')
        assert result['is_valid'] is False
        assert len(result['issues']) > 0

    def test_transaction_valid(self):
        result = validate_transaction_amount(Decimal('100'), Decimal('500'), 'deposit')
        assert result['is_valid'] is True

    def test_transaction_zero_amount(self):
        result = validate_transaction_amount(Decimal('0'), Decimal('500'), 'deposit')
        assert result['is_valid'] is False

    def test_transaction_insufficient_balance(self):
        result = validate_transaction_amount(Decimal('600'), Decimal('500'), 'withdraw')
        assert result['is_valid'] is False

    def test_transaction_absurd_amount(self):
        result = validate_transaction_amount(Decimal('9999999'), Decimal('9999999'), 'deposit')
        assert result['is_valid'] is False


class TestSecurityUtils:

    def test_session_id_uniqueness(self):
        ids = {generate_session_id() for _ in range(100)}
        assert len(ids) == 100

    def test_session_id_length(self):
        sid = generate_session_id()
        assert len(sid) > 20


class TestFormatting:

    def test_format_brl(self):
        result = format_currency(Decimal('1500.50'))
        assert 'R$' in result
        assert '1.500,50' in result

    def test_format_usd(self):
        result = format_currency(Decimal('1500.50'), 'USD')
        assert '$' in result

    def test_format_percentage(self):
        assert format_percentage(Decimal('75.5')) == '75.50%'

    def test_parse_currency_brl(self):
        assert parse_currency_input('R$ 500,50') == Decimal('500.50')

    def test_parse_currency_empty(self):
        assert parse_currency_input('') == Decimal('0')


class TestAnalyticsUtils:

    def test_moving_average(self):
        values = [Decimal(x) for x in [10, 20, 30, 40, 50]]
        result = calculate_moving_average(values, 3)
        assert len(result) == 3
        assert result[0] == Decimal('20.00')

    def test_moving_average_short_list(self):
        values = [Decimal('10'), Decimal('20')]
        result = calculate_moving_average(values, 5)
        assert result == values

    def test_performance_insights_no_sessions(self):
        insights = generate_performance_insights({'total_sessions': 0})
        assert any('suficientes' in i for i in insights)

    def test_performance_insights_high_win_rate(self):
        insights = generate_performance_insights({
            'total_sessions': 25,
            'win_rate': 70,
            'avg_session_result': 50,
        })
        assert any('Excelente' in i for i in insights)
