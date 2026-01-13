namespace UpStudy.Dtos.Payments;

public class LiqPayCheckoutDto
{
    public string Data { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
    public string CheckoutUrl { get; set; } = "https://www.liqpay.ua/api/3/checkout";
}